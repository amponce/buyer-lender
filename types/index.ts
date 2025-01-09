export type QuoteRequestStatus = 'PENDING' | 'IN_REVIEW' | 'QUOTED' | 'COMPLETED'
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface User {
  id: string
  email: string
  role: 'BUYER' | 'LENDER'
}

export interface Quote {
  id: string
  quoteRequestId: string
  lenderId: string
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  additionalNotes?: string
  status: QuoteStatus
  createdAt: string
  updatedAt: string
  isAIGenerated: boolean
  lender: {
    id: string
    email: string
  }
}

export interface AIConversation {
  id: string
  aiProfileId: string
  quoteRequestId: string
  status: string
  summary: string
  nextSteps: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  aiProfile: {
    id: string
    lenderId: string
  }
}

export interface QuoteRequest {
  id: string
  userId: string
  creditScore: number
  annualIncome: number
  additionalIncome: number
  monthlyCarLoan: number
  monthlyCreditCard: number
  monthlyOtherExpenses: number
  purchasePrice: number
  propertyAddress?: string
  propertyState: string
  propertyZipCode: string
  status: QuoteRequestStatus
  createdAt: string
  updatedAt: string
  quotes: Quote[]
  aiConversations: AIConversation[]
  buyer: {
    id: string
    email: string
  }
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  lenderId: string
  content: string
  createdAt: string
  isAIGenerated?: boolean
}

export interface RateSheet {
  '30_year_fixed': {
    base_rate: number
    min_credit_score: number
    points: number
    credit_adjustments: {
      '760+': number
      '740-759': number
      '720-739': number
      '700-719': number
      '680-699': number
      '660-679': number
      '<660': number
    }
  }
  '15_year_fixed': {
    base_rate: number
    min_credit_score: number
    points: number
  }
  'fha': {
    base_rate: number
    min_credit_score: number
    points: number
    mip_annual: number
    mip_upfront: number
  }
}

export interface LoanOption {
  type: string
  rate: number
  term: number
  monthlyPI: number
  monthlyMI: number
  monthlyTotal: number
  downPayment: number
  downPaymentPercent: number
  totalCashNeeded: number
}

export interface BuyerProfile {
  creditScore: number
  monthlyIncome: number
  dti: number
  ltv: number
  maxLoanAmount: number
  hasStrongCredit: boolean
  hasAdequateIncome: boolean
  hasDownPayment: boolean
  purchasePrice: number
}

export interface LenderProfile {
  id: string
  lender: {
    id: string
  }
  rateSheet: string
  isAutopilotActive: boolean
} 