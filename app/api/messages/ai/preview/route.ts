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

    const { content, requestId, lenderId } = await request.json()

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

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `As an AI assistant, your role is to enhance communication between mortgage lenders and buyers.
        Please process the following message from a lender to make it clear, professional, and easy to understand.
        Focus on:
        - Using clear, simple language
        - Maintaining a professional tone
        - Organizing information logically
        - Highlighting key points
        - Ensuring all technical terms are explained
        - Keeping the message concise while preserving all important information`
      },
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
    console.error('Error in POST /api/messages/ai/preview:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 