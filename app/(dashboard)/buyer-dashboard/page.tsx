import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BuyerDashboardClient from './BuyerDashboardClient'
import { QuoteRequest, Quote } from '@/types'

export default async function BuyerDashboard() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const quoteRequests = await prisma.quoteRequest.findMany({
    select: {
      id: true,
      buyerId: true,
      creditScore: true,
      annualIncome: true,
      monthlyCarLoan: true,
      monthlyCreditCard: true,
      monthlyOtherExpenses: true,
      purchasePrice: true,
      propertyAddress: true,
      propertyState: true,
      propertyZipCode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      quotes: {
        select: {
          id: true,
          interestRate: true,
          loanTerm: true,
          monthlyPayment: true,
          status: true,
          additionalNotes: true,
          isAIGenerated: true,
          createdAt: true,
          updatedAt: true,
          lender: true
        }
      },
      aiConversations: true,
      buyer: {
        select: {
          id: true,
          email: true
        }
      }
    },
    where: {
      buyerId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as unknown as QuoteRequest[]

  return <BuyerDashboardClient initialQuoteRequests={quoteRequests} />
}