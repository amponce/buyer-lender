import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface Quote {
  lenderId: string
}

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
    // Get all the async stuff first
    const [session, params] = await Promise.all([
      auth(),
      context.params
    ])

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get lender ID from query params
    const searchParams = new URL(request.url).searchParams
    const lenderId = searchParams.get('lenderId')
    console.log('GET: Extracted lenderId:', lenderId)

    if (!lenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Lender ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get quote request
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: params.requestId },
      include: {
        quotes: {
          select: {
            lenderId: true
          }
        }
      }
    })
    console.log('GET: Quote request:', JSON.stringify(quoteRequest, null, 2))

    if (!quoteRequest) {
      return new NextResponse(
        JSON.stringify({ error: 'Quote request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check authorization
    const isAuthorized = 
      quoteRequest.userId === session.user.id || 
      (session.user.id === lenderId && quoteRequest.quotes.some((quote: { lenderId: string }) => quote.lenderId === lenderId))

    console.log('GET: Authorization check:', {
      userId: session.user.id,
      quoteRequestUserId: quoteRequest.userId,
      lenderId,
      isAuthorized
    })

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        requestId: params.requestId,
        lenderId: lenderId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    console.log('GET: Found messages:', messages.length)

    return NextResponse.json(messages)
  } catch (error) {
    console.error('GET: Error in messages endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  let session: Awaited<ReturnType<typeof auth>> | null = null
  let searchParamsLenderId: string | null = null
  let messageContent: string | null = null
  
  try {
    console.log('POST: Starting message creation')
    const [sessionResult, params] = await Promise.all([
      auth(),
      context.params
    ])
    session = sessionResult
    
    const searchParams = new URL(request.url).searchParams
    searchParamsLenderId = searchParams.get('lenderId')

    if (!searchParamsLenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Lender ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { content } = await request.json()
    messageContent = content

    console.log('POST: Params:', params, 'LenderId:', searchParamsLenderId)
    console.log('POST: Session:', session?.user?.id)

    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user has access to this chat
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: params.requestId },
      include: {
        quotes: {
          select: {
            lenderId: true
          }
        }
      }
    })

    console.log('POST: Quote request found:', !!quoteRequest)
    if (quoteRequest) {
      console.log('POST: Quote request user:', quoteRequest.userId)
      console.log('POST: Quote request lenders:', quoteRequest.quotes.map((q: Quote) => q.lenderId))
    }

    if (!quoteRequest) {
      return new NextResponse(
        JSON.stringify({ error: 'Quote request not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is either the buyer or the specific lender
    const isAuthorized = 
      quoteRequest.userId === session.user.id || 
      (session.user.id === searchParamsLenderId && quoteRequest.quotes.some((quote: Quote) => quote.lenderId === searchParamsLenderId))

    console.log('POST: User authorized:', isAuthorized)

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create message in this specific chat thread
    const message = await prisma.message.create({
      data: {
        requestId: params.requestId,
        senderId: session.user.id,
        lenderId: searchParamsLenderId,
        content
      }
    })

    console.log('POST: Message created:', message.id)
    return NextResponse.json(message)
  } catch (error) {
    console.error('POST: Error creating message:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      requestId: context.params.then(p => p.requestId).catch(() => null),
      lenderId: searchParamsLenderId,
      userId: session?.user?.id,
      contentPreview: messageContent?.substring(0, 100)
    })
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
} 