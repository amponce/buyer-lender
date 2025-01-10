'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { onNewMessage, onNewQuoteRequest, initializeSocket } from '@/lib/socket'
import type { Quote, QuoteRequest, Message, ExtendedQuote } from '@/types/index'
import { format } from 'date-fns'
import QuoteDetailsModal from '@/components/QuoteDetailsModal'
import AnimatedQuote from '@/components/AnimatedQuote'

interface BuyerDashboardClientProps {
  initialQuoteRequests: QuoteRequest[]
}

export default function BuyerDashboardClient({ initialQuoteRequests }: BuyerDashboardClientProps) {
  const { data: session } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>(initialQuoteRequests)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({})
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState<Quote | null>(null)
  const [showDeclinedQuotes, setShowDeclinedQuotes] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([])

  useEffect(() => {
    if (!session?.user) return
    
    initializeSocket()
    fetchQuoteRequests()
    fetchScheduledCalls()

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
  }, [session])

  const fetchQuoteRequests = async () => {
    try {
      const response = await fetch('/api/quote-requests')
      if (!response.ok) {
        throw new Error('Failed to fetch quote requests')
      }
      const data = await response.json()
      console.log('Fetched quote requests:', data)
      setQuoteRequests(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching quote requests:', error)
      setError('Failed to fetch quote requests')
      setIsLoading(false)
    }
  }

  const fetchScheduledCalls = async () => {
    try {
      const response = await fetch('/api/scheduled-calls')
      if (response.ok) {
        const data = await response.json()
        setScheduledCalls(data)
      }
    } catch (error) {
      console.error('Error fetching scheduled calls:', error)
    }
  }

  const handleStatusUpdate = async (quoteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    try {
      // Get the quote request ID from the current quote
      const quoteRequest = quoteRequests.find(request => 
        request.quotes.some(quote => quote.id === quoteId)
      )

      if (!quoteRequest) {
        throw new Error('Quote request not found')
      }

      const response = await fetch(`/api/quote-requests/${quoteRequest.id}/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quote status')
      }

      // Refresh the quote requests after status update
      await fetchQuoteRequests()
      setSelectedQuoteForDetails(null)
    } catch (error) {
      console.error('Error updating quote status:', error)
    }
  }

  const openChat = (quote: Quote, requestId: string) => {
    console.log('Opening chat with quote:', quote, 'requestId:', requestId)
    
    // Parse additional notes for structured data
    let parsedData = {
      downPayment: 0,
      propertyValue: 0,
      totalCashNeeded: 0,
      monthlyMI: 0
    }

    if (quote.additionalNotes) {
      // Extract down payment
      const downPaymentMatch = quote.additionalNotes.match(/Down Payment: \$([0-9,]+)/)
      if (downPaymentMatch) {
        parsedData.downPayment = parseInt(downPaymentMatch[1].replace(/,/g, ''))
      }

      // Extract total cash needed
      const totalCashMatch = quote.additionalNotes.match(/Total Cash Needed: \$([0-9,]+)/)
      if (totalCashMatch) {
        parsedData.totalCashNeeded = parseInt(totalCashMatch[1].replace(/,/g, ''))
      }

      // Extract monthly MI
      const monthlyMIMatch = quote.additionalNotes.match(/Monthly MI: \$([0-9,.]+)/)
      if (monthlyMIMatch) {
        parsedData.monthlyMI = parseFloat(monthlyMIMatch[1].replace(/,/g, ''))
      }
    }

    // Calculate property value from down payment percentage if available
    const percentageMatch = quote.additionalNotes?.match(/Down Payment:.*\((\d+)%\)/)
    if (percentageMatch && parsedData.downPayment) {
      const percentage = parseInt(percentageMatch[1])
      parsedData.propertyValue = (parsedData.downPayment / percentage) * 100
    }

    // Cast the quote to ExtendedQuote and ensure all required properties are present
    const extendedQuote: ExtendedQuote = {
      ...quote,
      quoteRequestId: requestId,
      downPayment: parsedData.downPayment || quote.downPayment || 50000,
      propertyValue: parsedData.propertyValue || quote.propertyValue || 500000,
      loanAmount: quote.loanAmount || (quote.monthlyPayment * quote.loanTerm * 12),
      apr: quote.apr || (quote.interestRate + 0.25),
      closingCosts: quote.closingCosts || (parsedData.totalCashNeeded - parsedData.downPayment) || 12000,
      pmi: quote.pmi || parsedData.monthlyMI || (parsedData.downPayment && parsedData.propertyValue && (parsedData.downPayment / parsedData.propertyValue) < 0.2 ? 150 : 0),
      estimatedTaxes: quote.estimatedTaxes || 450,
      estimatedInsurance: quote.estimatedInsurance || 180,
      totalMonthlyPayment: quote.totalMonthlyPayment || (quote.monthlyPayment + (parsedData.monthlyMI || 0) + (quote.estimatedTaxes || 450) + (quote.estimatedInsurance || 180))
    };

    setSelectedQuoteForDetails(extendedQuote)
    setShowChat(true)
    setUnreadMessages(prev => ({
      ...prev,
      [quote.lender.id]: 0
    }))
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Mortgage Quote System</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Edit Profile
              </Link>
              <Link
                href="/quote-request"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
      <div className="container mx-auto px-4 py-8">
        <div className={`grid grid-cols-1 ${scheduledCalls.length > 0 ? 'lg:grid-cols-3' : ''} gap-8`}>
          <div className={scheduledCalls.length > 0 ? 'lg:col-span-2' : ''}>
            <h2 className="text-2xl font-bold mb-6">Your Quotes</h2>
            {quoteRequests.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quote requests yet</h3>
                <p className="text-gray-500">
                  Start by creating a new quote request to receive offers from lenders.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Awaiting Response Section */}
                {quoteRequests.some(req => req.quotes.length === 0) && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Awaiting Responses</h3>
                    <div className="space-y-4">
                      {quoteRequests
                        .filter(req => req.quotes.length === 0)
                        .map((request) => (
                          <div key={request.id} className="bg-white rounded-lg shadow border-2 border-primary-100">
                            <div className="p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    ${request.purchasePrice.toLocaleString()} - {request.propertyAddress}
                                  </h3>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {request.propertyState}, {request.propertyZipCode}
                                  </p>
                                  <p className="text-xs text-primary-600 font-medium mt-2">
                                    Waiting for lenders to respond • Requested {format(new Date(request.createdAt), 'MM/dd/yyyy')}
                                  </p>
                                </div>
                                <div className="bg-primary-50 px-3 py-1 rounded-full">
                                  <p className="text-sm font-medium text-primary-600">
                                    New Request
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
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
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Active Quotes Section */}
                {quoteRequests.some(req => req.quotes.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Properties</h3>
                    <div className="space-y-6">
                      {quoteRequests
                        .filter(req => req.quotes.length > 0)
                        .map((request) => {
                          const acceptedQuote = request.quotes.find(q => q.status === 'ACCEPTED')
                          const pendingQuotes = request.quotes.filter(q => q.status === 'PENDING')
                          const declinedQuotes = request.quotes.filter(q => q.status === 'DECLINED')

                          return (
                            <div key={request.id} className="bg-white rounded-lg shadow">
                              <div className="p-6 border-b">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                      ${request.purchasePrice.toLocaleString()} - {request.propertyAddress}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {request.propertyState}, {request.propertyZipCode}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <p className="text-xs text-gray-400">
                                        Requested {format(new Date(request.createdAt), 'MM/dd/yyyy')}
                                      </p>
                                      {acceptedQuote && (
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                          Quote Accepted
                                        </span>
                                      )}
                                      {!acceptedQuote && pendingQuotes.length > 0 && (
                                        <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                                          {pendingQuotes.length} Pending
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                                    <p className="text-sm font-medium text-gray-600">
                                      {request.quotes.length} Quote{request.quotes.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-500">
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

                              <div className="divide-y divide-gray-100">
                                {/* Accepted Quote Section */}
                                {acceptedQuote && (
                                  <div className="p-6">
                                    <h4 className="text-sm font-medium text-green-600 mb-4">Accepted Quote</h4>
                                    <AnimatedQuote
                                      key={acceptedQuote.id}
                                      quote={{ ...acceptedQuote, quoteRequestId: request.id }}
                                      index={0}
                                      onAccept={(quoteId) => handleStatusUpdate(quoteId, 'ACCEPTED')}
                                      onDecline={(quoteId) => handleStatusUpdate(quoteId, 'DECLINED')}
                                      onChat={openChat}
                                      onViewDetails={setSelectedQuoteForDetails}
                                      unreadMessages={unreadMessages[acceptedQuote.lender.id] || 0}
                                    />
                                  </div>
                                )}

                                {/* Pending Quotes Section */}
                                {!acceptedQuote && pendingQuotes.length > 0 && (
                                  <div className="p-6">
                                    <h4 className="text-sm font-medium text-primary-600 mb-4">
                                      {pendingQuotes.length} Pending Quote{pendingQuotes.length !== 1 ? 's' : ''}
                                    </h4>
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                      {pendingQuotes.map((quote, index) => (
                                        <AnimatedQuote
                                          key={quote.id}
                                          quote={{ ...quote, quoteRequestId: request.id }}
                                          index={index}
                                          onAccept={(quoteId) => handleStatusUpdate(quoteId, 'ACCEPTED')}
                                          onDecline={(quoteId) => handleStatusUpdate(quoteId, 'DECLINED')}
                                          onChat={openChat}
                                          onViewDetails={setSelectedQuoteForDetails}
                                          unreadMessages={unreadMessages[quote.lender.id] || 0}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Declined Quotes Section */}
                                {declinedQuotes.length > 0 && (
                                  <div className="p-6">
                                    <button
                                      onClick={() => setShowDeclinedQuotes(!showDeclinedQuotes)}
                                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
                                    >
                                      <span className={`transform transition-transform ${showDeclinedQuotes ? 'rotate-90' : ''}`}>
                                        ›
                                      </span>
                                      {declinedQuotes.length} Declined Quote{declinedQuotes.length !== 1 ? 's' : ''}
                                    </button>
                                    
                                    {showDeclinedQuotes && (
                                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {declinedQuotes.map((quote, index) => (
                                          <AnimatedQuote
                                            key={quote.id}
                                            quote={{ ...quote, quoteRequestId: request.id }}
                                            index={index}
                                            onAccept={(quoteId) => handleStatusUpdate(quoteId, 'ACCEPTED')}
                                            onDecline={(quoteId) => handleStatusUpdate(quoteId, 'DECLINED')}
                                            onChat={openChat}
                                            onViewDetails={setSelectedQuoteForDetails}
                                            unreadMessages={unreadMessages[quote.lender.id] || 0}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedQuoteForDetails && (
              <QuoteDetailsModal
                isOpen={!!selectedQuoteForDetails}
                onClose={() => {
                  setSelectedQuoteForDetails(null)
                  setShowChat(false)
                }}
                quote={selectedQuoteForDetails}
                onAccept={() => handleStatusUpdate(selectedQuoteForDetails.id, 'ACCEPTED')}
                onDecline={() => handleStatusUpdate(selectedQuoteForDetails.id, 'DECLINED')}
                initialShowChat={showChat}
              />
            )}
          </div>

          {scheduledCalls.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Scheduled Calls</h2>
              {/* Your scheduled calls rendering code */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 