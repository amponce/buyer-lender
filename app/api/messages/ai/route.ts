import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import type { ChatMessage, ChatRole } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

type QuoteWithLender = Awaited<ReturnType<typeof prisma.quote.findFirst>>
type MessageType = NonNullable<Awaited<ReturnType<typeof prisma.message.findFirst>>>

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userMessage, requestId, senderId, lenderId } = await request.json()

    if (!userMessage || !requestId || !senderId || !lenderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: true,
        quotes: {
          include: {
            lender: true
          }
        }
      }
    })

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 })
    }

    const hasAccess =
      quoteRequest.buyerId === session.user.id ||
      quoteRequest.quotes.some((quote: QuoteWithLender) => quote?.lenderId === session.user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a new message for the user
    await prisma.message.create({
      data: {
        content: userMessage,
        senderId,
        requestId,
        lenderId,
      }
    })

    // Get chat history
    const previousMessages = await prisma.message.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
      take: 10
    })

    // Format messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful mortgage advisor assistant. You are chatting with a ${
          session.user.role === 'BUYER' ? 'home buyer' : 'mortgage lender'
        }. Be professional, clear, and concise. Provide accurate information about mortgages and the home buying process.`
      },
      ...previousMessages.map((msg: MessageType) => ({
        role: (msg.senderId === session.user.id ? 'user' : 'assistant') as ChatRole,
        content: msg.content
      })),
      { role: 'user' as ChatRole, content: userMessage }
    ]

    // Set up streaming response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
              fullResponse += content
            }
          }

          // Save the complete response to database
          await prisma.message.create({
            data: {
              content: fullResponse,
              senderId: lenderId,
              requestId,
              lenderId,
            }
          })

          controller.close()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request.'
          console.error('Error in stream processing:', errorMessage)
          controller.enqueue(encoder.encode(errorMessage))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Error in AI message endpoint:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
