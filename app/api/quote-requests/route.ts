import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeBuyerProfile, analyzeLoanOptions, formatCurrency, generatePersonalizedMessage } from '@/lib/loan-analysis'
import { RateSheet, LenderProfile, BuyerProfile, LoanOption } from '@/types'

// GET /api/quote-requests - Buyer gets their requests with quotes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    console.log('GET /api/quote-requests - Session:', JSON.stringify(session?.user, null, 2))
    
    if (!session?.user) {
      console.log('GET /api/quote-requests - No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      console.log('GET /api/quote-requests - Not a buyer:', session.user.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('GET /api/quote-requests - Searching for requests with userId:', session.user.id)
    const requests = await prisma.quoteRequest.findMany({
      where: { 
        buyer: {
          id: session.user.id
        }
      },
      include: {
        quotes: {
          include: {
            lender: {
              select: {
                id: true,
                email: true,
                role: true
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
    console.error('Error in GET /api/quote-requests:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/quote-requests - Buyer creates a new request
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    console.log('POST /api/quote-requests - Session:', {
      user: session?.user,
      authenticated: !!session?.user,
      role: session?.user?.role
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()
    console.log('POST /api/quote-requests - Request data:', data)
    
    // Validate required fields
    const requiredFields = [
      'creditScore',
      'annualIncome',
      'purchasePrice',
      'propertyState',
      'propertyZipCode',
      'propertyCity',
      'propertyAddress',
      'downPaymentAmount'
    ]
    
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Create or connect the user first
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        email: session.user.email!,
        role: session.user.role
      },
      create: {
        id: session.user.id,
        email: session.user.email!,
        role: session.user.role,
        password: 'oauth-user' // Default password for OAuth users
      }
    })

    // Create the quote request
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        buyer: {
          connect: {
            id: user.id
          }
        },
        creditScore: parseInt(data.creditScore.toString()),
        annualIncome: parseFloat(data.annualIncome.toString()),
        monthlyCarLoan: parseFloat(data.monthlyCarLoan?.toString() || '0'),
        monthlyCreditCard: parseFloat(data.monthlyCreditCard?.toString() || '0'),
        monthlyOtherExpenses: parseFloat(data.monthlyOtherExpenses?.toString() || '0'),
        purchasePrice: parseFloat(data.purchasePrice.toString()),
        downPaymentAmount: parseFloat(data.downPaymentAmount.toString()),
        propertyAddress: data.propertyAddress,
        propertyCity: data.propertyCity,
        propertyState: data.propertyState,
        propertyZipCode: data.propertyZipCode,
        employmentStatus: data.employmentStatus || 'EMPLOYED',
        employmentYears: parseFloat(data.employmentYears?.toString() || '0')
      }
    })

    // Find all lenders with autopilot enabled
    const lendersWithAI = await prisma.lenderAIProfile.findMany({
      where: {
        isAutopilotActive: true
      },
      include: {
        lender: true
      }
    })

    // For each lender's AI, analyze the request and create initial quotes/conversation
    const aiPromises = lendersWithAI.map(async (lenderProfile: LenderProfile) => {
      // Create AI conversation
      const conversation = await prisma.aIConversation.create({
        data: {
          aiProfileId: lenderProfile.id,
          quoteRequestId: quoteRequest.id,
          status: 'ACTIVE',
          summary: 'Initial analysis of quote request',
          nextSteps: 'Analyzing financing options'
        }
      })

      // Parse rate sheet and analyze buyer profile
      const rateSheet = JSON.parse(lenderProfile.rateSheet) as RateSheet
      const monthlyDebts = quoteRequest.monthlyCarLoan + quoteRequest.monthlyCreditCard + quoteRequest.monthlyOtherExpenses
      
      const buyerProfile = analyzeBuyerProfile(
        quoteRequest.creditScore,
        quoteRequest.annualIncome,
        monthlyDebts,
        quoteRequest.downPaymentAmount,
        quoteRequest.purchasePrice
      )
      
      const loanOptions = analyzeLoanOptions(
        quoteRequest.purchasePrice,
        quoteRequest.creditScore,
        buyerProfile.monthlyIncome,
        monthlyDebts,
        quoteRequest.downPaymentAmount,
        rateSheet
      )

      // Create quotes for each viable option with staggered timing
      const quotePromises = loanOptions.map((option, index) => 
        new Promise(resolve => setTimeout(async () => {
          const quote = await prisma.quote.create({
            data: {
              quoteRequestId: quoteRequest.id,
              lenderId: lenderProfile.lender.id,
              interestRate: option.rate,
              loanTerm: option.term,
              monthlyPayment: option.monthlyTotal,
              additionalNotes: `${option.type}\n` +
                `Down Payment: ${formatCurrency(option.downPayment)} (${option.downPaymentPercent}%)\n` +
                `Monthly P&I: ${formatCurrency(option.monthlyPI)}\n` +
                `Monthly MI: ${formatCurrency(option.monthlyMI)}\n` +
                `Total Cash Needed: ${formatCurrency(option.totalCashNeeded)}`
            }
          })
          resolve(quote)
        }, index * 2000)) // 2 second delay between each quote
      )

      await Promise.all(quotePromises)

      // Generate personalized message
      const messageContent = generatePersonalizedMessage(buyerProfile, loanOptions)

      // Create conversation summary
      const summary = {
        profile: {
          creditScore: buyerProfile.creditScore,
          monthlyIncome: formatCurrency(buyerProfile.monthlyIncome),
          dti: buyerProfile.dti.toFixed(1) + '%',
          ltv: buyerProfile.ltv.toFixed(1) + '%',
          maxLoanAmount: formatCurrency(buyerProfile.maxLoanAmount)
        },
        challenges: [
          !buyerProfile.hasStrongCredit && 'Credit score below preferred minimum',
          !buyerProfile.hasAdequateIncome && 'High debt-to-income ratio',
          !buyerProfile.hasDownPayment && 'Insufficient down payment',
          buyerProfile.purchasePrice > buyerProfile.maxLoanAmount && 'Purchase price exceeds estimated maximum loan amount'
        ].filter(Boolean),
        recommendedPrograms: loanOptions.map(opt => opt.type),
        nextSteps: [
          !buyerProfile.hasStrongCredit && 'Credit improvement needed',
          !buyerProfile.hasAdequateIncome && 'Debt reduction recommended',
          !buyerProfile.hasDownPayment && 'Down payment assistance exploration',
          'Review available loan options',
          'Discuss qualification requirements'
        ].filter(Boolean)
      }

      // Update conversation with summary
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: {
          summary: JSON.stringify(summary)
        }
      })

      // Create initial message
      await prisma.message.create({
        data: {
          requestId: quoteRequest.id,
          senderId: lenderProfile.lender.id,
          lenderId: lenderProfile.lender.id,
          content: messageContent,
          isAIGenerated: true,
          aiConversationId: conversation.id
        }
      })
    })

    await Promise.all(aiPromises)

    return NextResponse.json(quoteRequest)
  } catch (error) {
    console.error('Error in POST /api/quote-requests:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 