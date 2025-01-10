import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        status: 'PENDING',
        downPayment: quoteData.downPayment,
        propertyValue: quoteData.propertyValue,
        loanAmount: quoteData.loanAmount,
        apr: quoteData.apr || quoteData.interestRate + 0.25,
        closingCosts: quoteData.closingCosts,
        pmi: quoteData.pmi,
        estimatedTaxes: quoteData.estimatedTaxes,
        estimatedInsurance: quoteData.estimatedInsurance,
        totalMonthlyPayment: quoteData.totalMonthlyPayment || (
          quoteData.monthlyPayment + 
          (quoteData.pmi || 0) + 
          (quoteData.estimatedTaxes || 0) + 
          (quoteData.estimatedInsurance || 0)
        )
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