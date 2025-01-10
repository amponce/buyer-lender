'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChatModal from '@/components/ChatModal'
import QuoteModal from '@/components/QuoteModal'
import { formatCurrency } from '@/lib/utils'
import { QuoteRequest, QuoteRequestStatus, Quote, User } from '@/types'

interface Filters {
  creditScoreMin: number
  creditScoreMax: number
  incomeMin: number
  incomeMax: number
  loanSizeMin: number
  loanSizeMax: number
  state: string
}

export default function LenderDashboardClient() {
  const { data: session } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'completed'>('new')
  const [filters, setFilters] = useState<Filters>({
    creditScoreMin: 0,
    creditScoreMax: 850,
    incomeMin: 0,
    incomeMax: 1000000,
    loanSizeMin: 0,
    loanSizeMax: 10000000,
    state: ''
  })

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

  const filteredRequests = quoteRequests.filter(request => {
    // Filter out requests that the lender has already responded to
    const hasLenderResponded = request.quotes.some(q => q.lenderId === session?.user?.id)
    
    if (activeTab === 'new') {
      if (hasLenderResponded || 
          request.status === 'COMPLETED' || 
          request.status === 'IN_REVIEW') {
        return false
      }
    } else {
      // 'completed' tab - show only requests this lender has responded to
      if (!hasLenderResponded) {
        return false
      }
    }

    // Apply filters
    return (
      request.creditScore >= filters.creditScoreMin &&
      request.creditScore <= filters.creditScoreMax &&
      request.annualIncome >= filters.incomeMin &&
      request.annualIncome <= filters.incomeMax &&
      request.purchasePrice >= filters.loanSizeMin &&
      request.purchasePrice <= filters.loanSizeMax &&
      (filters.state === '' || request.propertyState === filters.state)
    )
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
                status: 'QUOTED' as const
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
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'new'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            New Requests
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credit Score
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.creditScoreMin || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  creditScoreMin: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.creditScoreMax || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  creditScoreMax: parseInt(e.target.value) || 850
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.incomeMin || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  incomeMin: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.incomeMax || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  incomeMax: parseInt(e.target.value) || 1000000
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Size
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.loanSizeMin || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  loanSizeMin: parseInt(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.loanSizeMax || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  loanSizeMax: parseInt(e.target.value) || 10000000
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                state: e.target.value
              }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All States</option>
              {Array.from(new Set(quoteRequests.map(r => r.propertyState))).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.map((request) => (
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
            otherUserId={selectedRequest.buyerId}
            requestId={selectedRequest.id}
            lenderId={session?.user?.id || ''}
          />
        </>
      )}
    </div>
  )
} 