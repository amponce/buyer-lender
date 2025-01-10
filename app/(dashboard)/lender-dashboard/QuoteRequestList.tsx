'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChatModal from '@/components/ChatModal'
import QuoteModal from '@/components/QuoteModal'
import { formatCurrency } from '@/lib/utils'
import type { QuoteRequest } from '@/types'
import { BookmarkIcon as BookmarkOutline } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid, XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'

interface Filters {
  creditScoreMin: number
  creditScoreMax: number
  incomeMin: number
  incomeMax: number
  loanSizeMin: number
  loanSizeMax: number
  state: string
}

export default function QuoteRequestList() {
  const { data: session } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
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
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  const [skippedQuotes, setSkippedQuotes] = useState<Set<string>>(new Set())
  const [showNonActionable, setShowNonActionable] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    fetchQuoteRequests()
    const savedWatchlist = localStorage.getItem('watchlist')
    const savedSkipped = localStorage.getItem('skippedQuotes')
    if (savedWatchlist) {
      setWatchlist(new Set(JSON.parse(savedWatchlist)))
    }
    if (savedSkipped) {
      setSkippedQuotes(new Set(JSON.parse(savedSkipped)))
    }
  }, [session])

  const fetchQuoteRequests = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/quote-requests/lender')
      if (!response.ok) throw new Error('Failed to fetch quote requests')
      const data = await response.json()
      setQuoteRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitQuote = async (quoteData: {
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
      setError(err instanceof Error ? err.message : 'Failed to submit quote')
    }
  }

  const toggleWatchlist = async (requestId: string) => {
    const newWatchlist = new Set(watchlist)
    if (newWatchlist.has(requestId)) {
      newWatchlist.delete(requestId)
    } else {
      newWatchlist.add(requestId)
    }
    setWatchlist(newWatchlist)
    localStorage.setItem('watchlist', JSON.stringify(Array.from(newWatchlist)))
    
    try {
      await fetch(`/api/quote-requests/${requestId}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched: !watchlist.has(requestId) })
      })
    } catch (err) {
      console.error('Failed to update watchlist status:', err)
    }
  }

  const skipQuote = async (requestId: string) => {
    const newSkipped = new Set(skippedQuotes)
    newSkipped.add(requestId)
    setSkippedQuotes(newSkipped)
    localStorage.setItem('skippedQuotes', JSON.stringify(Array.from(newSkipped)))
    
    try {
      await fetch(`/api/quote-requests/${requestId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      console.error('Failed to skip quote:', err)
    }
  }

  const filteredRequests = quoteRequests.filter(request => {
    if (skippedQuotes.has(request.id)) return false;
    
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

  // Sort and categorize requests
  const categorizedRequests = {
    needsResponse: [] as QuoteRequest[],
    inProgress: [] as QuoteRequest[],
    completed: [] as QuoteRequest[]
  }

  // Categorize requests
  filteredRequests.forEach(request => {
    const hasLenderResponded = request.quotes.some(q => q.lenderId === session?.user?.id)
    
    if (!hasLenderResponded && request.status === 'PENDING') {
      categorizedRequests.needsResponse.push(request)
    } else if (request.status === 'QUOTED' || request.status === 'IN_REVIEW') {
      categorizedRequests.inProgress.push(request)
    } else {
      categorizedRequests.completed.push(request)
    }
  })

  // Sort each category by date (most recent first)
  const sortByDate = (a: QuoteRequest, b: QuoteRequest) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  categorizedRequests.needsResponse.sort(sortByDate)
  categorizedRequests.inProgress.sort(sortByDate)
  categorizedRequests.completed.sort(sortByDate)

  // Add a function to determine if a request is actionable
  const isActionable = (request: QuoteRequest) => {
    return !skippedQuotes.has(request.id) && request.status === 'PENDING'
  }

  // Separate actionable and non-actionable requests
  const actionableRequests = categorizedRequests.needsResponse.filter(isActionable)
  const nonActionableRequests = categorizedRequests.needsResponse.filter(request => !isActionable(request))

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quote Requests</h2>
        
        <div className="flex gap-4">
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
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
      
      {/* Needs Response Section */}
      {categorizedRequests.needsResponse.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Needs Response ({categorizedRequests.needsResponse.length})
          </h2>
          <div className="grid gap-6">
            {categorizedRequests.needsResponse.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-l-red-500 border-t border-r border-b border-gray-200 relative"
              >
                <button
                  onClick={() => skipQuote(request.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  title="Skip this quote"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => toggleWatchlist(request.id)}
                  className="absolute top-2 right-9 text-gray-400 hover:text-gray-600"
                  title={watchlist.has(request.id) ? "Remove from watchlist" : "Add to watchlist"}
                >
                  {watchlist.has(request.id) ? (
                    <BookmarkSolid className="h-5 w-5 text-primary-600" />
                  ) : (
                    <BookmarkOutline className="h-5 w-5" />
                  )}
                </button>

                <div className="flex justify-between items-start mt-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Property in {request.propertyState} ({request.propertyZipCode})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Purchase Price: {formatCurrency(request.purchasePrice)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Needs Response
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Credit Score:</span> {request.creditScore}
                  </div>
                  <div>
                    <span className="font-medium">Annual Income:</span> {formatCurrency(request.annualIncome)}
                  </div>
                  <div>
                    <span className="font-medium">Monthly Debt:</span> {formatCurrency(
                      request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsQuoteModalOpen(true)
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Submit Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist Section */}
      {activeTab === 'new' && Array.from(watchlist).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-primary-600 mb-4">
            Watchlist ({Array.from(watchlist).length})
          </h2>
          <div className="grid gap-6">
            {quoteRequests
              .filter(request => watchlist.has(request.id))
              .map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-l-primary-500 border-t border-r border-b border-gray-200 relative"
                >
                  <button
                    onClick={() => skipQuote(request.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    title="Skip this quote"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => toggleWatchlist(request.id)}
                    className="absolute top-2 right-9 text-gray-400 hover:text-gray-600"
                    title="Remove from watchlist"
                  >
                    <BookmarkSolid className="h-5 w-5 text-primary-600" />
                  </button>

                  <div className="flex justify-between items-start mt-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Property in {request.propertyState} ({request.propertyZipCode})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Purchase Price: {formatCurrency(request.purchasePrice)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'PENDING' 
                        ? 'bg-red-100 text-red-800'
                        : request.status === 'QUOTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Credit Score:</span> {request.creditScore}
                    </div>
                    <div>
                      <span className="font-medium">Annual Income:</span> {formatCurrency(request.annualIncome)}
                    </div>
                    <div>
                      <span className="font-medium">Monthly Debt:</span> {formatCurrency(
                        request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    {request.status === 'PENDING' ? (
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsQuoteModalOpen(true)
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        Submit Quote
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsChatOpen(true)
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 bg-white rounded-md hover:bg-primary-50 border border-primary-200"
                      >
                        Chat with Buyer
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      {categorizedRequests.inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-600 mb-4">
            In Progress ({categorizedRequests.inProgress.length})
          </h2>
          <div className="grid gap-6">
            {categorizedRequests.inProgress.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Property in {request.propertyState} ({request.propertyZipCode})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Purchase Price: {formatCurrency(request.purchasePrice)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {request.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Credit Score:</span> {request.creditScore}
                  </div>
                  <div>
                    <span className="font-medium">Annual Income:</span> {formatCurrency(request.annualIncome)}
                  </div>
                  <div>
                    <span className="font-medium">Monthly Debt:</span> {formatCurrency(
                      request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsChatOpen(true)
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 bg-white rounded-md hover:bg-primary-50 border border-primary-200"
                  >
                    Chat with Buyer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {categorizedRequests.completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-green-600 mb-4">
            Completed ({categorizedRequests.completed.length})
          </h2>
          <div className="grid gap-6">
            {categorizedRequests.completed.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-l-green-500 border-t border-r border-b border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Property in {request.propertyState} ({request.propertyZipCode})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Purchase Price: {formatCurrency(request.purchasePrice)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {request.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Credit Score:</span> {request.creditScore}
                  </div>
                  <div>
                    <span className="font-medium">Annual Income:</span> {formatCurrency(request.annualIncome)}
                  </div>
                  <div>
                    <span className="font-medium">Monthly Debt:</span> {formatCurrency(
                      request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsChatOpen(true)
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 bg-white rounded-md hover:bg-primary-50 border border-primary-200"
                  >
                    Chat with Buyer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Requests Section */}
      {actionableRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-primary-600 mb-4">
            Active Quote Requests ({actionableRequests.length})
          </h2>
          <div className="grid gap-6">
            {actionableRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-l-primary-500 border-t border-r border-b border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Property in {request.propertyState} ({request.propertyZipCode})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Purchase Price: {formatCurrency(request.purchasePrice)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Needs Response
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Credit Score:</span> {request.creditScore}
                  </div>
                  <div>
                    <span className="font-medium">Annual Income:</span> {formatCurrency(request.annualIncome)}
                  </div>
                  <div>
                    <span className="font-medium">Monthly Debt:</span> {formatCurrency(
                      request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedRequest(request)
                      setIsQuoteModalOpen(true)
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    Submit Quote
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Non-actionable Requests Section */}
      {nonActionableRequests.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowNonActionable(!showNonActionable)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <span className={`transform transition-transform ${showNonActionable ? 'rotate-90' : ''}`}>
              ›
            </span>
            {nonActionableRequests.length} Non-actionable Request{nonActionableRequests.length !== 1 ? 's' : ''}
          </button>
          
          <AnimatePresence>
            {showNonActionable && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid gap-4">
                  {nonActionableRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            ${request.purchasePrice.toLocaleString()} - {request.propertyCity}, {request.propertyState}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {skippedQuotes.has(request.id) ? 'Skipped' : request.status}
                          </p>
                        </div>
                        {skippedQuotes.has(request.id) && (
                          <button
                            onClick={() => skipQuote(request.id)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {selectedRequest && (
        <>
          <QuoteModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            onSubmit={handleSubmitQuote}
            quoteRequest={selectedRequest}
          />
          {selectedRequest.buyer && (
            <ChatModal
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUserId={session?.user?.id || ''}
              currentUserType="lender"
              otherUserId={selectedRequest.buyer.id}
              requestId={selectedRequest.id}
              lenderId={session?.user?.id || ''}
            />
          )}
        </>
      )}
    </div>
  )
} 