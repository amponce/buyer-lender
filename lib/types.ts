export type QuoteRequestStatus = 'PENDING' | 'IN_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED'
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface QuoteRequest {
  id: number
  userId: number
  creditScore: number
  annualSalary: number
  additionalIncome: number | null
  carLoan: number
  creditCard: number
  otherExpenses: number
  purchasePrice: number
  propertyAddress: string | null
  state: string
  zipCode: string
  status: QuoteRequestStatus
  createdAt: Date
  updatedAt: Date
  quotes: Quote[]
}

export interface Quote {
  id: number
  quoteRequestId: number
  lenderId: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  additionalNotes: string | null
  status: QuoteStatus
  createdAt: Date
  updatedAt: Date
} 