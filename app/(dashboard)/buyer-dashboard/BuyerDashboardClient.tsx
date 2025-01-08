'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import ChatModal from '@/components/ChatModal'
import Link from 'next/link'
import { onNewMessage, onNewQuoteRequest, initializeSocket } from '@/lib/socket'
import type { Quote, QuoteRequest, Message } from '@/types'

export default function BuyerDashboardClient() {
  const { data: session, status } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({})

  useEffect(() => {
    console.log('Session status:', status, 'Session:', JSON.stringify(session, null, 2))
    if (status === 'loading') {
      console.log('Session is loading...')
      return
    }
    if (!session?.user) {
      console.log('No user session found')
      setError('Please sign in to view your quote requests')
      setIsLoading(false)
      return
    }
    
    console.log('User is authenticated:', session.user)
    initializeSocket()
    fetchQuoteRequests()

    // Listen for new messages
    onNewMessage((message: Message) => {
      console.log('New message received:', message)
      setUnreadMessages(prev => ({
        ...prev,
        [message.senderId]: (prev[message.senderId] || 0) + 1
      }))
    })

    // Listen for new quote requests
    onNewQuoteRequest((quoteRequest: QuoteRequest) => {
      console.log('New quote request received:', quoteRequest)
      setQuoteRequests(prev => [quoteRequest, ...prev])
    })
  }, [session, status])

  const fetchQuoteRequests = async () => {
    try {
      setIsLoading(true)
      setError('')
      console.log('Fetching quote requests with session:', JSON.stringify(session?.user, null, 2))
      const response = await fetch('/api/quote-requests')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(errorText || 'Failed to fetch quote requests')
      }
      
      const data = await response.json()
      console.log('Received quote requests:', JSON.stringify(data, null, 2))
      setQuoteRequests(data)
      setIsLoading(false)
      
      if (data.length === 0) {
        console.log('No quote requests found for user')
      }
    } catch (err) {
      console.error('Error in fetchQuoteRequests:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quote requests')
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (quoteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) throw new Error('Failed to update quote status')
      
      setQuoteRequests(prevRequests =>
        prevRequests.map(request => ({
          ...request,
          quotes: request.quotes.map(quote =>
            quote.id === quoteId ? { ...quote, status } : quote
          )
        }))
      )
    } catch (err) {
      console.error('Error updating quote status:', err)
      setError('Failed to update quote status')
    }
  }

  const openChat = (quote: Quote, requestId: string) => {
    console.log('Opening chat with quote:', quote, 'requestId:', requestId)
    setSelectedQuote({ ...quote, quoteRequestId: requestId })
    setIsChatOpen(true)
    setUnreadMessages(prev => ({
      ...prev,
      [quote.lender.id]: 0
    }))
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Mortgage Quote System</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/quote-request"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                New Quote Request
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Quote Requests</h2>
        </div>

        {quoteRequests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No quote requests yet.</p>
            <p className="mt-2">
              <Link href="/quote-request" className="text-primary-600 hover:underline">
                Submit your first quote request
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {quoteRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Property in {request.propertyState} ({request.propertyZipCode})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Purchase Price: ${request.purchasePrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        request.quotes.length > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.quotes.length > 0 ? `${request.quotes.length} Quotes Received` : 'Awaiting Quotes'}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Credit Score:</span> {request.creditScore}
                    </div>
                    <div>
                      <span className="font-medium">Annual Income:</span> ${request.annualIncome.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Monthly Debt:</span> ${(request.monthlyCarLoan + request.monthlyCreditCard + request.monthlyOtherExpenses).toLocaleString()}
                    </div>
                  </div>
                </div>

                {request.quotes.length > 0 && (
                  <div className="p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Received Quotes</h4>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {request.quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className="bg-gray-50 p-6 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold">
                                {quote.interestRate}% APR
                              </h4>
                              <p className="text-sm text-gray-500">
                                {quote.loanTerm} year term
                              </p>
                              <p className="text-xs text-gray-500">
                                from {quote.lender.email}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                quote.status === 'ACCEPTED'
                                  ? 'bg-green-100 text-green-800'
                                  : quote.status === 'DECLINED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {quote.status}
                            </span>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700">
                              Monthly Payment
                            </p>
                            <p className="text-xl font-bold">
                              ${quote.monthlyPayment.toLocaleString()}
                            </p>
                          </div>

                          {quote.additionalNotes && (
                            <p className="text-sm text-gray-600 mb-4">{quote.additionalNotes}</p>
                          )}

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => openChat(quote, request.id)}
                              className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-white rounded-md hover:bg-primary-50 border border-primary-200 relative"
                            >
                              Chat with Lender
                              {unreadMessages[quote.lender.id] > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {unreadMessages[quote.lender.id]}
                                </span>
                              )}
                            </button>

                            {quote.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(quote.id, 'ACCEPTED')}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(quote.id, 'DECLINED')}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedQuote && (
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            currentUserId={session?.user?.id || ''}
            currentUserType="buyer"
            otherUserId={selectedQuote.lender.id}
            requestId={selectedQuote.quoteRequestId}
          />
        )}
      </div>
    </div>
  )
} 