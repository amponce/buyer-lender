import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/quote-requests/[requestId]/quotes - Submit a quote (lenders only)
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const data = await request.json()
    const { interestRate, loanTerm, monthlyPayment, additionalNotes } = data

    if (!interestRate || !loanTerm || !monthlyPayment) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if request exists and is pending
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: params.requestId },
      include: {
        aiConversations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            aiProfile: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!quoteRequest) {
      return new NextResponse('Quote request not found', { status: 404 })
    }

    if (quoteRequest.status !== 'PENDING') {
      return new NextResponse('Quote request is no longer accepting quotes', { status: 400 })
    }

    // Check if lender already submitted a quote
    const existingQuote = await prisma.quote.findFirst({
      where: {
        quoteRequestId: params.requestId,
        lenderId: session.user.id
      }
    })

    // If there's an existing quote and it's AI-generated, update it
    if (existingQuote?.isAIGenerated) {
      const updatedQuote = await prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          interestRate,
          loanTerm,
          monthlyPayment,
          additionalNotes,
          isAIGenerated: false // Mark as manually updated
        },
        include: {
          lender: {
            select: {
              id: true,
              email: true
            }
          }
        }
      })

      // If there's an active AI conversation, mark it as transferred
      if (quoteRequest.aiConversations[0]) {
        await prisma.aIConversation.update({
          where: { id: quoteRequest.aiConversations[0].id },
          data: {
            status: 'TRANSFERRED_TO_LENDER',
            nextSteps: 'Quote has been reviewed and updated by lender'
          }
        })
      }

      return NextResponse.json({
        ...updatedQuote,
        aiConversation: quoteRequest.aiConversations[0] || null
      })
    }

    // If no existing quote or it's not AI-generated, create a new one
    if (existingQuote && !existingQuote.isAIGenerated) {
      return new NextResponse('You have already submitted a quote for this request', { status: 400 })
    }

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        quoteRequestId: params.requestId,
        lenderId: session.user.id,
        interestRate,
        loanTerm,
        monthlyPayment,
        additionalNotes,
        status: 'PENDING',
        isAIGenerated: false
      },
      include: {
        lender: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      ...quote,
      aiConversation: quoteRequest.aiConversations[0] || null
    })
  } catch (error) {
    console.error('Error in POST /api/quote-requests/[requestId]/quotes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH /api/quote-requests/[requestId]/quotes - Update quote status (buyers only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const data = await request.json()
    const { quoteId, status } = data

    if (!quoteId || !status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return new NextResponse('Invalid quote ID or status', { status: 400 })
    }

    // Verify the quote belongs to this request and the user owns the request
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        quoteRequestId: params.requestId
      },
      include: {
        quoteRequest: true
      }
    })

    if (!quote) {
      return new NextResponse('Quote not found', { status: 404 })
    }

    if (quote.quoteRequest.userId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status },
      include: {
        lender: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    // If a quote was accepted, mark all others as declined
    if (status === 'ACCEPTED') {
      await prisma.quote.updateMany({
        where: {
          quoteRequestId: params.requestId,
          id: { not: quoteId }
        },
        data: { status: 'DECLINED' }
      })

      // Update the quote request status
      await prisma.quoteRequest.update({
        where: { id: params.requestId },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Error in PATCH /api/quote-requests/[requestId]/quotes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 