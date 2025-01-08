import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/quote-requests - Buyer gets their requests with quotes
export async function GET() {
  try {
    const session = await auth()
    console.log('GET /api/quote-requests - Session:', JSON.stringify(session?.user, null, 2))
    
    if (!session?.user) {
      console.log('GET /api/quote-requests - No session found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      console.log('GET /api/quote-requests - Not a buyer:', session.user.role)
      return new NextResponse('Forbidden', { status: 403 })
    }

    console.log('GET /api/quote-requests - Searching for requests with userId:', session.user.id)
    const requests = await prisma.quoteRequest.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        quotes: {
          include: {
            lender: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('GET /api/quote-requests - Found requests:', requests.length)
    if (requests.length === 0) {
      console.log('GET /api/quote-requests - No requests found for user:', session.user.id)
    } else {
      console.log('GET /api/quote-requests - Request IDs:', requests.map((r: { id: string }) => r.id))
    }
    
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error in GET /api/quote-requests:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// POST /api/quote-requests - Buyer creates a new request
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const data = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'creditScore',
      'annualIncome',
      'purchasePrice',
      'propertyState',
      'propertyZipCode'
    ]
    
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      return new NextResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        { status: 400 }
      )
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        userId: session.user.id,
        creditScore: parseInt(data.creditScore.toString()),
        annualIncome: parseFloat(data.annualIncome.toString()),
        additionalIncome: parseFloat(data.additionalIncome?.toString() || '0'),
        monthlyCarLoan: parseFloat(data.monthlyCarLoan?.toString() || '0'),
        monthlyCreditCard: parseFloat(data.monthlyCreditCard?.toString() || '0'),
        monthlyOtherExpenses: parseFloat(data.monthlyOtherExpenses?.toString() || '0'),
        purchasePrice: parseFloat(data.purchasePrice.toString()),
        propertyAddress: data.propertyAddress || '',
        propertyState: data.propertyState,
        propertyZipCode: data.propertyZipCode,
        status: "PENDING"
      }
    })

    return NextResponse.json(quoteRequest)
  } catch (error) {
    console.error('Error in POST /api/quote-requests:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 