import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

    // Verify access to the quote request
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: params.requestId },
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
      (session.user.role === 'BUYER' && quoteRequest.buyer.id === session.user.id) || 
      (session.user.role === 'LENDER' && session.user.id === lenderId)

    if (!isAuthorized) {
      return new NextResponse(
        JSON.stringify({ error: 'You are not authorized to view these messages' }),
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

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/messages/[requestId]:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  try {
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

    const searchParams = new URL(request.url).searchParams
    const lenderId = searchParams.get('lenderId')

    if (!lenderId) {
      return new NextResponse(
        JSON.stringify({ error: 'Lender ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { content } = await request.json()
    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: 'Message content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify access to the quote request
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id: params.requestId },
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
      (session.user.role === 'BUYER' && quoteRequest.buyer.id === session.user.id) || 
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
        requestId: params.requestId,
        senderId: session.user.id,
        lenderId,
        content,
        isAIGenerated: false,
        createdAt: new Date()
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/messages/[requestId]:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 