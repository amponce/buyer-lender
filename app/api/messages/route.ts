import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { requestId, content } = await request.json()

    // Verify the user has access to this chat
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: {
          select: {
            lenderId: true
          }
        }
      }
    })

    if (!quoteRequest) {
      return new NextResponse('Quote request not found', { status: 404 })
    }

    // Check if user is either the buyer or one of the lenders
    const isAuthorized = 
      quoteRequest.userId === session.user.id || 
      quoteRequest.quotes.some((quote: { lenderId: string }) => quote.lenderId === session.user.id)

    if (!isAuthorized) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        requestId,
        senderId: session.user.id,
        content
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 