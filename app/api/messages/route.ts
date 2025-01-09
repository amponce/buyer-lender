import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

type QuoteWithLenderId = {
  lenderId: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, content, lenderId } = body

    if (!requestId || !content || !lenderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the user has access to this chat
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
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 })
    }

    // Check if user is either the buyer or the lender
    const isAuthorized = 
      (session.user.role === 'BUYER' && quoteRequest.buyer.id === session.user.id) || 
      (session.user.role === 'LENDER' && session.user.id === lenderId)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'You are not authorized to send messages in this chat' }, { status: 403 })
    }

    // Verify the lender has a quote for this request if the sender is a buyer
    if (session.user.role === 'BUYER') {
      const hasQuoteFromLender = quoteRequest.quotes.some(
        (quote: QuoteWithLenderId) => quote.lenderId === lenderId
      )
      if (!hasQuoteFromLender) {
        return NextResponse.json({ error: 'No quote found from this lender' }, { status: 403 })
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        requestId,
        senderId: session.user.id,
        lenderId,
        content,
        isAIGenerated: false,
        createdAt: new Date()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 