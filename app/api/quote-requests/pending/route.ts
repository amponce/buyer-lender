import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/quote-requests/pending - Lender gets pending requests
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const requests = await prisma.quoteRequest.findMany({
      where: { 
        status: 'PENDING',
        quotes: {
          none: {
            lenderId: session.user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error in GET /api/quote-requests/pending:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 