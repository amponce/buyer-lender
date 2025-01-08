'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChatModal from '@/components/ChatModal'
import QuoteModal from '@/components/QuoteModal'
import { formatCurrency } from '@/lib/utils'

interface QuoteRequest {
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
  status: 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'DECLINED'
  createdAt: Date
  user: {
    id: string
    email: string
  }
  quotes: Array<{
    id: string
    lenderId: string
    interestRate: number
    loanTerm: number
    monthlyPayment: number
    status: string
  }>
}

export default function LenderDashboardClient() {
  const { data: session } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof QuoteRequest>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterState, setFilterState] = useState('')

  useEffect(() => {
    fetchQuoteRequests()
    setupWebSocket()
  }, [])

  const setupWebSocket = () => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'NEW_QUOTE_REQUEST') {
        setQuoteRequests(prev => [data.quoteRequest, ...prev])
      }
    }

    return () => {
      ws.close()
    }
  }

  const fetchQuoteRequests = async () => {
    try {
      const response = await fetch('/api/quote-requests')
      if (!response.ok) throw new Error('Failed to fetch quote requests')
      const data = await response.json()
      setQuoteRequests(data)
    } catch (err) {
      setError('Failed to load quote requests')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof QuoteRequest) => {
    setSortField(field)
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const sortedAndFilteredRequests = quoteRequests
    .filter(request => !filterState || request.propertyState === filterState)
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      const modifier = sortDirection === 'asc' ? 1 : -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * modifier
      }
      
      return ((aValue as number) - (bValue as number)) * modifier
    })

  const handleQuoteSubmit = async (quoteData: {
    interestRate: number
    loanTerm: number
    monthlyPayment: number
    additionalNotes?: string
  }) => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/quote-requests/${selectedRequest.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })

      if (!response.ok) throw new Error('Failed to submit quote')

      const newQuote = await response.json()
      
      // Update local state
      setQuoteRequests(prev =>
        prev.map(request =>
          request.id === selectedRequest.id
            ? {
                ...request,
                quotes: [...request.quotes, newQuote],
                status: 'QUOTED'
              }
            : request
        )
      )

      setIsQuoteModalOpen(false)
    } catch (err) {
      console.error(err)
      setError('Failed to submit quote')
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Quote Requests</h1>
        
        <div className="flex gap-4 mb-4">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All States</option>
            {Array.from(new Set(quoteRequests.map(r => r.propertyState))).map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <button
            onClick={() => handleSort('createdAt')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
          >
            Sort by Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>

          <button
            onClick={() => handleSort('purchasePrice')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
          >
            Sort by Price {sortField === 'purchasePrice' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedAndFilteredRequests.map((request) => (
          <div
            key={request.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {formatCurrency(request.purchasePrice)}
                </h3>
                <p className="text-sm text-gray-500">
                  {request.propertyState}, {request.propertyZipCode}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  request.status === 'QUOTED'
                    ? 'bg-blue-100 text-blue-800'
                    : request.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800'
                    : request.status === 'DECLINED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {request.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Credit Score</span>
                <span className="font-medium">{request.creditScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Annual Income</span>
                <span className="font-medium">{formatCurrency(request.annualIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Monthly Debt</span>
                <span className="font-medium">
                  {formatCurrency(
                    request.monthlyCarLoan +
                    request.monthlyCreditCard +
                    request.monthlyOtherExpenses
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {request.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setIsQuoteModalOpen(true)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Submit Quote
                </button>
              )}

              {request.quotes.some(q => q.lenderId === session?.user?.id) && (
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setIsChatModalOpen(true)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                >
                  Chat with Buyer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <>
          <QuoteModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            onSubmit={handleQuoteSubmit}
            quoteRequest={selectedRequest}
          />

          <ChatModal
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            currentUserId={session?.user?.id || ''}
            currentUserType="lender"
            otherUserId={selectedRequest.user.id}
            requestId={selectedRequest.id}
          />
        </>
      )}
    </div>
  )
} 