'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ChatModal from '@/components/ChatModal'
import type { QuoteRequest } from '@/types'

export default function QuoteRequestList() {
  const { data: session } = useSession()
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    fetchQuoteRequests()
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

  const handleSubmitQuote = async (requestId: string, quoteData: any) => {
    try {
      const response = await fetch(`/api/quote-requests/${requestId}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      })
      
      if (!response.ok) throw new Error('Failed to submit quote')
      
      // Refresh the list
      fetchQuoteRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quote')
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Quote Requests</h2>
      
      {quoteRequests.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No quote requests available.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {quoteRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow p-6">
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
                    request.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'QUOTED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {request.status}
                </span>
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
                <button
                  onClick={() => handleSubmitQuote(request.id, {
                    interestRate: 6.25,
                    loanTerm: 30,
                    monthlyPayment: 2500,
                    additionalNotes: 'Sample quote - customize this'
                  })}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  Submit Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          currentUserId={session?.user?.id || ''}
          currentUserType="lender"
          otherUserId={selectedRequest.buyerId}
          requestId={selectedRequest.id}
        />
      )}
    </div>
  )
} 