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

    let skipped = true // Default to true if not provided
    try {
      const body = await request.json()
      skipped = body.skipped ?? true
    } catch (e) {
      console.log('No request body provided, using default value')
    }

    const { id: quoteRequestId } = await context.params

    // Update or create skip entry
    const skipEntry = await prisma.skipped_quotes.upsert({
      where: {
        lenderId_quoteRequestId: {
          lenderId: session.user.id,
          quoteRequestId
        }
      },
      update: {
        skipped
      },
      create: {
        lenderId: session.user.id,
        quoteRequestId,
        skipped
      }
    })

    return NextResponse.json(skipEntry)
  } catch (error) {
    console.error('Error updating skip status:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 