import { PrismaClient } from '@prisma/client'
import { auth } from './auth'
import type { QuoteRequest } from '@/types'

const prisma = new PrismaClient()

export async function getQuoteRequests() {
  const session = await auth()
  if (!session) return []

  if (session.user.role === 'LENDER') {
    return prisma.quoteRequest.findMany({
      include: {
        quotes: {
          include: {
            lender: true
          }
        },
        buyer: true,
        aiConversations: {
          include: {
            messages: true,
            aiProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  return prisma.quoteRequest.findMany({
    where: {
      buyerId: session.user.id,
    },
    include: {
      quotes: {
        include: {
          lender: true
        }
      },
      buyer: true,
      aiConversations: {
        include: {
          messages: true,
          aiProfile: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getQuoteRequest(id: string) {
  const session = await auth()
  if (!session) return null

  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      quotes: {
        include: {
          lender: true
        }
      },
      buyer: true,
      aiConversations: {
        include: {
          messages: true,
          aiProfile: true
        }
      }
    },
  })
} 