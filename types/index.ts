import { Quote as PrismaQuote, User as PrismaUser, QuoteRequest as PrismaQuoteRequest } from '@prisma/client'

export type QuoteRequestStatus = 'PENDING' | 'IN_REVIEW' | 'QUOTED' | 'COMPLETED'
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface QuoteWithDetails extends PrismaQuote {
  lender: PrismaUser;
  quoteRequest: PrismaQuoteRequest;
}

export interface BuyerDashboardClientProps {
  quotes: QuoteWithDetails[];
  chatHistory: Record<string, number>;
}

export interface User {
  id: string
  email: string
  role: 'BUYER' | 'LENDER'
  name?: string
  company?: string
  licenseNumber?: string
  phoneNumber?: string
  profilePhoto?: string
  bio?: string
  isManager?: boolean
  teamId?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  occupation?: string
  employer?: string
}

export interface Quote {
  id: string;
  quoteRequestId: string;
  lenderId: string;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  additionalNotes?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  isAIGenerated?: boolean;
  lender: {
    id: string;
    email: string;
    name: string;
    company: string;
    licenseNumber: string;
    phoneNumber: string;
    profilePhoto?: string;
    bio: string;
  };
  downPayment?: number;
  propertyValue?: number;
  loanAmount?: number;
  apr?: number;
  closingCosts?: number;
  pmi?: number;
  estimatedTaxes?: number;
  estimatedInsurance?: number;
  totalMonthlyPayment?: number;
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

export interface QuoteRequest extends PrismaQuoteRequest {
  additionalIncome: number
  quotes: Quote[]
  buyer: User
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  lenderId: string
  content: string
  createdAt: string
  isAIGenerated?: boolean
  isAIProcessed?: boolean
  isOriginalMessage?: boolean
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

export type ExtendedQuote = Quote & {
  downPayment: number;
  propertyValue: number;
  loanAmount: number;
  apr: number;
  closingCosts: number;
  pmi: number;
  estimatedTaxes: number;
  estimatedInsurance: number;
  totalMonthlyPayment: number;
}

export interface ExtendedQuoteRequest extends QuoteRequest {
  hasAIResponse?: boolean;
  aiSummary?: any;
  aiNextSteps?: string;
  aiStatus?: 'COMPLETED' | 'ACTIVE' | 'TRANSFERRED_TO_LENDER' | 'NO_AI';
  lastAIMessage?: Message;
  lastMessage?: Message;
  hasManualQuote?: boolean;
  hasAIQuote?: boolean;
  aiQuote?: Quote;
  manualQuote?: Quote;
}

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export type UserType = 'BUYER' | 'LENDER' | 'LENDER_TEAM'

