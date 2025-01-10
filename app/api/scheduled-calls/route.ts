import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { quoteId, scheduledAt, memo } = await req.json()

    // Get the quote to verify permissions and get lender info
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        quoteRequest: {
          include: {
            buyer: true
          }
        },
        lender: true
      }
    })

    if (!quote) {
      return new NextResponse('Quote not found', { status: 404 })
    }

    // Verify the user is either the buyer or lender
    if (session.user.id !== quote.quoteRequest.buyerId && session.user.id !== quote.lenderId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Create the scheduled call
    const scheduledCall = await prisma.scheduledCall.create({
      data: {
        quoteId,
        buyerId: quote.quoteRequest.buyerId,
        lenderId: quote.lenderId,
        scheduledAt: new Date(scheduledAt),
        memo,
      },
      include: {
        buyer: true,
        lender: true,
      }
    })

    // Send email notifications
    const emailPromises = [
      sendEmail({
        to: quote.quoteRequest.buyer.email,
        subject: 'Call Scheduled with Lender',
        text: `A call has been scheduled with ${quote.lender.name} for ${new Date(scheduledAt).toLocaleString()}.\n\nMemo: ${memo || 'No additional notes'}`
      }),
      sendEmail({
        to: quote.lender.email,
        subject: 'Call Scheduled with Buyer',
        text: `A call has been scheduled with ${quote.quoteRequest.buyer.name} for ${new Date(scheduledAt).toLocaleString()}.\n\nMemo: ${memo || 'No additional notes'}`
      })
    ]

    await Promise.all(emailPromises)

    return NextResponse.json(scheduledCall)
  } catch (error) {
    console.error('Error scheduling call:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'SCHEDULED'

    // Get calls where the user is either the buyer or lender
    const calls = await prisma.scheduledCall.findMany({
      where: {
        OR: [
          { buyerId: session.user.id },
          { lenderId: session.user.id }
        ],
        status
      },
      include: {
        buyer: {
          select: {
            name: true,
            email: true
          }
        },
        lender: {
          select: {
            name: true,
            email: true,
            company: true
          }
        },
        quote: {
          select: {
            interestRate: true,
            loanTerm: true,
            monthlyPayment: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error('Error in GET /api/scheduled-calls:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id, status } = await req.json()

    const call = await prisma.scheduledCall.findUnique({
      where: { id },
      include: { buyer: true, lender: true }
    })

    if (!call) {
      return new NextResponse('Call not found', { status: 404 })
    }

    // Verify the user is either the buyer or lender
    if (session.user.id !== call.buyerId && session.user.id !== call.lenderId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const updatedCall = await prisma.scheduledCall.update({
      where: { id },
      data: { status },
      include: {
        buyer: true,
        lender: true
      }
    })

    // Send notifications about status change
    const emailPromises = [
      sendEmail({
        to: call.buyer.email,
        subject: `Call ${status.toLowerCase()}`,
        text: `Your scheduled call with ${call.lender.name} has been ${status.toLowerCase()}.`
      }),
      sendEmail({
        to: call.lender.email,
        subject: `Call ${status.toLowerCase()}`,
        text: `Your scheduled call with ${call.buyer.name} has been ${status.toLowerCase()}.`
      })
    ]

    await Promise.all(emailPromises)

    return NextResponse.json(updatedCall)
  } catch (error) {
    console.error('Error updating call status:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 