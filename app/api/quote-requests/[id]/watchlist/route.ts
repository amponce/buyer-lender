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

    const { watched } = await request.json()
    const { id: quoteRequestId } = await context.params

    // Update or create watchlist entry
    const watchlistEntry = await prisma.watchlist.upsert({
      where: {
        lenderId_quoteRequestId: {
          lenderId: session.user.id,
          quoteRequestId
        }
      },
      update: {
        watched
      },
      create: {
        lenderId: session.user.id,
        quoteRequestId,
        watched
      }
    })

    return NextResponse.json(watchlistEntry)
  } catch (error) {
    console.error('Error updating watchlist:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 