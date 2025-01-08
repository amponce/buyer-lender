'use client'

import { useState } from 'react'
import { ChatBubbleLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import QuoteModal from '@/components/QuoteModal'
import ChatModal from '@/components/ChatModal'
import { QuoteRequest } from '@/lib/types'

interface Props {
  initialQuoteRequests: QuoteRequest[]
}

export default function LenderDashboardClient({ initialQuoteRequests }: Props) {
  const [quoteRequests, setQuoteRequests] = useState(initialQuoteRequests)
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  const handleQuoteSubmit = async (requestId: number, quoteData: any) => {
    try {
      const response = await fetch(`/api/quotes/${requestId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      })

      if (response.ok) {
        setQuoteRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? { ...req, status: 'QUOTED' }
              : req
          )
        )
        setIsQuoteModalOpen(false)
      }
    } catch (error) {
      console.error('Error submitting quote:', error)
    }
  }

  return (
    <div className="space-y-6">
      {quoteRequests.map((request) => (
        <div key={request.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">Request #{request.id}</h3>
              <p className="text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-4">
              {request.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setSelectedRequest(request)
                    setIsQuoteModalOpen(true)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Submit Quote
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(request)
                  setIsChatModalOpen(true)
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                Chat with Buyer
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Credit Score</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.creditScore}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(request.annualSalary)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(request.purchasePrice)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.status}</dd>
            </div>
          </div>
        </div>
      ))}

      {selectedRequest && (
        <>
          <QuoteModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            onSubmit={(quoteData) => handleQuoteSubmit(selectedRequest.id, quoteData)}
            quoteRequest={selectedRequest}
          />
          <ChatModal
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            currentUserId={selectedRequest.userId.toString()}
            currentUserType="lender"
            otherUserId={`buyer${selectedRequest.userId}`}
            requestId={selectedRequest.id.toString()}
          />
        </>
      )}
    </div>
  )
} 