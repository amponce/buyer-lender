import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { content, requestId, lenderId, isAIProcessed, isOriginalMessage } = await request.json()

    if (!content || !requestId || !lenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify access to the quote request
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: true,
        quotes: {
          select: {
            lenderId: true
          }
        }
      }
    })

    if (!quoteRequest) {
      return new NextResponse(
        JSON.stringify({ error: 'Quote request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is either the buyer or the lender
    const isAuthorized = 
      (session.user.role === 'BUYER' && quoteRequest.buyerId === session.user.id) || 
      (session.user.role === 'LENDER' && session.user.id === lenderId)

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ error: 'You are not authorized to send messages' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        requestId,
        senderId: session.user.id,
        lenderId,
        content,
        isAIGenerated: false
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 