'use client'
import { useState } from 'react'
import { formatCurrency } from '@/app/constants/states'

interface Quote {
  id: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  additionalNotes?: string
  status: string
  lender: {
    email: string
  }
}

interface QuoteRequest {
  id: number
  creditScore: number
  annualIncome: number
  purchasePrice: number
  propertyState: string
  status: string
  createdAt: string
  quotes: Quote[]
}

interface Props {
  quoteRequests: QuoteRequest[]
}

export default function BuyerDashboardClient({ quoteRequests }: Props) {
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Quote Requests</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quote Requests List */}
        <div className="md:col-span-1 space-y-4">
          {quoteRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => setSelectedRequest(request)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedRequest?.id === request.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-gray-900">
                {formatCurrency(request.purchasePrice)}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'QUOTED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Request Details */}
        <div className="md:col-span-2">
          {selectedRequest ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quote Request Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-500">Purchase Price</label>
                  <div className="font-medium">{formatCurrency(selectedRequest.purchasePrice)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Credit Score</label>
                  <div className="font-medium">{selectedRequest.creditScore}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Annual Income</label>
                  <div className="font-medium">{formatCurrency(selectedRequest.annualIncome)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Property State</label>
                  <div className="font-medium">{selectedRequest.propertyState}</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Lender Quotes</h3>
              {selectedRequest.quotes.length > 0 ? (
                <div className="space-y-4">
                  {selectedRequest.quotes.map((quote) => (
                    <div key={quote.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">Lender</label>
                          <div className="font-medium">{quote.lender.email}</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Interest Rate</label>
                          <div className="font-medium">{quote.interestRate}%</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Loan Term</label>
                          <div className="font-medium">{quote.loanTerm} years</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Monthly Payment</label>
                          <div className="font-medium">{formatCurrency(quote.monthlyPayment)}</div>
                        </div>
                      </div>
                      {quote.additionalNotes && (
                        <div className="mt-4">
                          <label className="text-sm text-gray-500">Additional Notes</label>
                          <div className="text-sm mt-1">{quote.additionalNotes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No quotes received yet. Lenders will respond to your request soon.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              Select a quote request to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 