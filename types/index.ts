export interface Quote {
  id: string
  lenderId: string
  quoteRequestId: string
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  additionalNotes?: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: Date
  lender: {
    id: string
    email: string
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
  propertyAddress: string
  propertyState: string
  propertyZipCode: string
  status: string
  createdAt: Date
  quotes: Quote[]
}

export interface Message {
  id: string
  senderId: string
  requestId: string
  content: string
  timestamp: Date
} 