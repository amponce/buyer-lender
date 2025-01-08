import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const data = await request.json()
    console.log('Received data:', data)
    
    // Validate required fields
    const requiredFields = ['creditScore', 'annualIncome', 'purchasePrice', 'propertyState', 'propertyZipCode']
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        userId: user.id, // Use the verified user's ID
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

    return NextResponse.json(quote)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.log('Error details:', errorMessage)
    
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create quote request' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const quotes = await prisma.quoteRequest.findMany({
      where: {
        userId: parseInt(session.user.id),
        ...(status && { status }),
      },
      include: {
        quotes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(quotes)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.log('Error details:', errorMessage)
    
    return new NextResponse(
      JSON.stringify({ error: 'Error fetching quotes' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}