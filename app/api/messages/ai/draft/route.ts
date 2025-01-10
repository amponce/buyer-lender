import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'
import type { ChatMessage } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { content, requestId, lenderId, conversation } = await request.json()

    if (!content || !requestId || !lenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is the lender
    if (session.user.role !== 'LENDER' || session.user.id !== lenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format the conversation for the AI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful mortgage advisor assistant helping a lender communicate with a buyer.
Your role is to engage in a conversation with the lender to understand their message and help them craft the perfect response for the buyer.
Ask clarifying questions if needed. When the lender is satisfied, help them synthesize their message into a clear, professional, and easy to understand format.
Focus on:
- Using clear, simple language
- Maintaining a professional tone
- Organizing information logically
- Highlighting key points
- Ensuring all technical terms are explained
- Keeping the message concise while preserving all important information`
      },
      ...(conversation || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content
      }
    ]

    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    })

    // Transform the response into a readable stream
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
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
    console.error('Error in POST /api/messages/ai/draft:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 