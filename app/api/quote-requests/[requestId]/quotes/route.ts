import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/quote-requests/[requestId]/quotes - Submit a quote (lenders only)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> } // Updated to handle asynchronous params
) {
  try {
    const { requestId } = await context.params; // Await the params

    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const data = await request.json();
    const { interestRate, loanTerm, monthlyPayment, additionalNotes } = data;

    if (!interestRate || !loanTerm || !monthlyPayment) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if the quote request exists and is pending
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: requestId },
      include: {
        aiConversations: {
          where: { status: 'ACTIVE' },
          include: { aiProfile: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!quoteRequest) {
      return new NextResponse('Quote request not found', { status: 404 });
    }

    if (quoteRequest.status !== 'PENDING') {
      return new NextResponse('Quote request is no longer accepting quotes', { status: 400 });
    }

    // Check if the lender already submitted a quote
    const existingQuote = await prisma.quote.findFirst({
      where: {
        quoteRequestId: requestId,
        lenderId: session.user.id,
      },
    });

    if (existingQuote?.isAIGenerated) {
      const updatedQuote = await prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          interestRate,
          loanTerm,
          monthlyPayment,
          additionalNotes,
          isAIGenerated: false,
        },
        include: {
          lender: {
            select: {
              id: true,
              email: true,
              name: true,
              company: true,
              licenseNumber: true,
              phoneNumber: true,
              profilePhoto: true,
              bio: true,
            },
          },
        },
      });

      if (quoteRequest.aiConversations[0]) {
        await prisma.aIConversation.update({
          where: { id: quoteRequest.aiConversations[0].id },
          data: {
            status: 'TRANSFERRED_TO_LENDER',
            nextSteps: 'Quote has been reviewed and updated by lender',
          },
        });
      }

      return NextResponse.json({
        ...updatedQuote,
        aiConversation: quoteRequest.aiConversations[0] || null,
      });
    }

    if (existingQuote && !existingQuote.isAIGenerated) {
      return new NextResponse('You have already submitted a quote for this request', { status: 400 });
    }

    const quote = await prisma.quote.create({
      data: {
        quoteRequestId: requestId,
        lenderId: session.user.id,
        interestRate,
        loanTerm,
        monthlyPayment,
        additionalNotes,
        status: 'PENDING',
        isAIGenerated: false,
      },
      include: {
        lender: {
          select: {
            id: true,
            email: true,
            name: true,
            company: true,
            licenseNumber: true,
            phoneNumber: true,
            profilePhoto: true,
            bio: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...quote,
      aiConversation: quoteRequest.aiConversations[0] || null,
    });
  } catch (error) {
    console.error('Error in POST /api/quote-requests/[requestId]/quotes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH /api/quote-requests/[requestId]/quotes - Update quote status (buyers only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> } // Updated to handle asynchronous params
) {
  try {
    const { requestId } = await context.params; // Await the params

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { quoteId, status } = data;

    if (!quoteId || !status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid quote ID or status' }, { status: 400 });
    }

    // Verify the quote belongs to this request and the user owns the request
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        quoteRequestId: requestId,
      },
      include: { quoteRequest: true },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.quoteRequest.buyerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status },
      include: {
        lender: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (status === 'ACCEPTED') {
      await prisma.$transaction([
        prisma.quote.updateMany({
          where: {
            quoteRequestId: requestId,
            id: { not: quoteId },
          },
          data: { status: 'DECLINED' },
        }),
        prisma.quoteRequest.update({
          where: { id: requestId },
          data: { status: 'COMPLETED' },
        }),
      ]);
    }

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Error in PATCH /api/quote-requests/[requestId]/quotes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}