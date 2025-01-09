import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { RateSheet, LenderProfile, LoanOption } from '@/types'
import { analyzeBuyerProfile, analyzeLoanOptions, formatCurrency, generatePersonalizedMessage } from '@/lib/loan-analysis'

// POST /api/test/quote-requests - Test endpoint that bypasses auth
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
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

    // Get test buyer
    const testBuyer = await prisma.user.findFirst({
      where: {
        email: 'aaron.m.ponce+buyer1@gmail.com'
      }
    })

    if (!testBuyer) {
      return NextResponse.json(
        { error: 'Test buyer not found. Please run the seed script first.' },
        { status: 404 }
      )
    }

    // Create the quote request
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        buyerId: testBuyer.id,
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

      // Create quotes for each viable option
      const quotePromises = loanOptions.map((option: LoanOption) => 
        prisma.quote.create({
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
        recommendedPrograms: loanOptions.map((opt: LoanOption) => opt.type),
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
    console.error('Error in POST /api/test/quote-requests:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 