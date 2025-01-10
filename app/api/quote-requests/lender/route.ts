import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { QuoteRequest, Quote, Message, AIConversation, ExtendedQuoteRequest, QuoteRequestStatus } from '@/types'
import type { QuoteRequest as PrismaQuoteRequest } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    console.log('GET /api/quote-requests/lender - Session:', JSON.stringify(session?.user, null, 2))
    
    if (!session?.user) {
      console.log('GET /api/quote-requests/lender - No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'LENDER') {
      console.log('GET /api/quote-requests/lender - Not a lender:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // First get the lender's AI profile
    const lenderAIProfile = await prisma.lenderAIProfile.findFirst({
      where: {
        lenderId: session.user.id
      }
    })

    if (!lenderAIProfile) {
      return NextResponse.json({ error: 'No AI profile found for lender' }, { status: 404 })
    }

    // Get all active quote requests and include the lender's AI conversations
    const requests = await prisma.quoteRequest.findMany({
      where: {
        status: {
          not: 'COMPLETED' // Exclude completed requests
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            email: true
          }
        },
        quotes: {
          where: {
            lenderId: session.user.id
          },
          include: {
            lender: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          }
        },
        aiConversations: {
          where: {
            aiProfileId: lenderAIProfile.id
          },
          include: {
            aiProfile: true,
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        messages: {
          where: {
            OR: [
              { senderId: session.user.id },
              { lenderId: session.user.id }
            ]
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the requests to include AI status information
    const requestsWithAIStatus = requests.map((request) => {
      const aiConversation = request.aiConversations[0]
      const lastAIMessage = aiConversation?.messages[0]
      const lastMessage = request.messages[0]
      const aiQuote = request.quotes.find((q) => q.isAIGenerated)
      const manualQuote = request.quotes.find((q) => !q.isAIGenerated)

      const transformedRequest = {
        ...request,
        status: request.status as QuoteRequestStatus,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        hasAIResponse: !!aiConversation,
        aiSummary: aiConversation?.summary ? JSON.parse(aiConversation.summary) : null,
        aiNextSteps: aiConversation?.nextSteps,
        aiStatus: aiConversation?.status || 'NO_AI',
        lastAIMessage: lastAIMessage ? {
          ...lastAIMessage,
          createdAt: lastAIMessage.createdAt.toISOString()
        } : undefined,
        lastMessage: lastMessage ? {
          ...lastMessage,
          createdAt: lastMessage.createdAt.toISOString()
        } : undefined,
        hasManualQuote: !!manualQuote,
        hasAIQuote: !!aiQuote,
        aiQuote,
        manualQuote
      }

      return transformedRequest as unknown as ExtendedQuoteRequest
    })

    console.log('GET /api/quote-requests/lender - Found requests:', requests.length)
    if (requests.length === 0) {
      console.log('GET /api/quote-requests/lender - No requests found')
    } else {
      console.log('GET /api/quote-requests/lender - Request IDs:', requestsWithAIStatus.map(r => r.id))
    }
    
    return NextResponse.json(requestsWithAIStatus)
  } catch (error) {
    console.error('Error in GET /api/quote-requests/lender:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 