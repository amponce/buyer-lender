import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/quote-requests/[id]/quotes - Submit a quote (lenders only)
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse('Only lenders can submit quotes', { status: 403 })
    }

    const quoteData = await request.json()
    const { id: quoteRequestId } = await context.params

    // Verify the quote request exists and is still pending
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: quoteRequestId },
      include: {
        quotes: {
          where: {
            lenderId: session.user.id
          }
        }
      }
    })

    if (!quoteRequest) {
      return new NextResponse('Quote request not found', { status: 404 })
    }

    if (quoteRequest.status !== 'PENDING') {
      return new NextResponse('Quote request is no longer accepting quotes', { status: 400 })
    }

    if (quoteRequest.quotes.length > 0) {
      return new NextResponse('You have already submitted a quote for this request', { status: 400 })
    }

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        quoteRequestId,
        lenderId: session.user.id,
        interestRate: quoteData.interestRate,
        loanTerm: quoteData.loanTerm,
        monthlyPayment: quoteData.monthlyPayment,
        additionalNotes: quoteData.additionalNotes,
        status: 'PENDING'
      }
    })

    // Update quote request status
    await prisma.quoteRequest.update({
      where: { id: quoteRequestId },
      data: { status: 'QUOTED' }
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error submitting quote:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// PATCH /api/quote-requests/[id]/quotes - Update quote status (buyers only)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      return new NextResponse('Only buyers can update quote status', { status: 403 })
    }

    const { status, quoteId } = await request.json()
    const { id: quoteRequestId } = await context.params

    // Verify the quote request belongs to the buyer
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: {
        id: quoteRequestId,
        buyerId: session.user.id
      },
      include: {
        quotes: true
      }
    })

    if (!quoteRequest) {
      return new NextResponse('Quote request not found', { status: 404 })
    }

    // Update the quote status
    const updatedQuote = await prisma.quote.update({
      where: {
        id: quoteId,
        quoteRequestId
      },
      data: {
        status
      }
    })

    // If a quote is accepted, update the request status and decline other quotes
    if (status === 'ACCEPTED') {
      await prisma.$transaction([
        // Update request status
        prisma.quoteRequest.update({
          where: { id: quoteRequestId },
          data: { status: 'COMPLETED' }
        }),
        // Decline other quotes
        prisma.quote.updateMany({
          where: {
            quoteRequestId,
            id: { not: quoteId },
            status: 'PENDING'
          },
          data: { status: 'DECLINED' }
        })
      ])
    }

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Error updating quote status:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 