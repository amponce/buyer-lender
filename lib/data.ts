import { PrismaClient } from '@prisma/client'
import { auth } from './auth'
import { QuoteRequest } from './types'

const prisma = new PrismaClient()

export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  const session = await auth()
  if (!session) return []

  if (session.user.role === 'LENDER') {
    return prisma.quoteRequest.findMany({
      include: {
        quotes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  return prisma.quoteRequest.findMany({
    where: {
      userId: parseInt(session.user.id),
    },
    include: {
      quotes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getQuoteRequest(id: number): Promise<QuoteRequest | null> {
  const session = await auth()
  if (!session) return null

  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      quotes: true,
    },
  })
} 