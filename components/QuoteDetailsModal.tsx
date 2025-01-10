'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import QuoteDisclaimer from './QuoteDisclaimer'
import LoanAgentChat from './LoanAgentChat'

interface QuoteDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  quote: {
    id: string
    lenderId: string
    lender: {
      id: string
      name: string
      company: string
      licenseNumber: string
      phoneNumber: string
      email: string
      bio: string
    }
    interestRate: number
    loanTerm: number
    monthlyPayment: number
    additionalNotes?: string
    status: string
    downPayment?: number
    propertyValue?: number
    loanAmount?: number
    apr?: number
    closingCosts?: number
    pmi?: number
    estimatedTaxes?: number
    estimatedInsurance?: number
    totalMonthlyPayment?: number
  }
  onAccept?: () => void
  onDecline?: () => void
  hasConversation?: boolean
  initialShowChat?: boolean
}

export default function QuoteDetailsModal({
  isOpen,
  onClose,
  quote,
  onAccept,
  onDecline,
  hasConversation = false,
  initialShowChat = false
}: QuoteDetailsModalProps) {
  const [showChat, setShowChat] = useState(initialShowChat)
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'costs'>('overview')
  const { toast } = useToast()

  // Parse additional notes for structured data
  let parsedData = {
    downPayment: 0,
    propertyValue: 0,
    totalCashNeeded: 0,
    monthlyMI: 0,
    percentage: 0
  }

  if (quote.additionalNotes) {
    // Extract down payment
    const downPaymentMatch = quote.additionalNotes.match(/Down Payment: \$([0-9,]+)/);
    if (downPaymentMatch) {
      parsedData.downPayment = parseInt(downPaymentMatch[1].replace(/,/g, ''));
    }

    // Extract total cash needed
    const totalCashMatch = quote.additionalNotes.match(/Total Cash Needed: \$([0-9,]+)/);
    if (totalCashMatch) {
      parsedData.totalCashNeeded = parseInt(totalCashMatch[1].replace(/,/g, ''));
    }

    // Extract down payment percentage
    const percentageMatch = quote.additionalNotes.match(/Down Payment:.*\((\d+)%\)/);
    if (percentageMatch) {
      parsedData.percentage = parseInt(percentageMatch[1]);
      if (parsedData.downPayment) {
        parsedData.propertyValue = (parsedData.downPayment / parsedData.percentage) * 100;
      }
    }
  }

  // Ensure all lender information is populated with defaults if missing
  const lender = {
    id: quote.lender.id,
    name: quote.lender.name || 'Unknown',
    company: quote.lender.company || 'Premier Mortgage',
    licenseNumber: quote.lender.licenseNumber || 'NMLS#123456',
    phoneNumber: quote.lender.phoneNumber || '(555) 123-4567',
    email: quote.lender.email || 'contact@lender.com',
    bio: quote.lender.bio || 'Experienced mortgage professional with over 10 years in the industry.'
  }

  // Ensure all loan details are populated with calculated or default values
  const loanDetails = {
    propertyValue: parsedData.propertyValue || quote.propertyValue || 750000,
    downPayment: parsedData.downPayment || quote.downPayment || 150000,
    loanAmount: quote.loanAmount || (quote.monthlyPayment * quote.loanTerm * 12),
    apr: quote.apr || (quote.interestRate + 0.25),
    closingCosts: quote.closingCosts || (parsedData.totalCashNeeded - parsedData.downPayment) || 15000,
    pmi: quote.pmi || parsedData.monthlyMI || (parsedData.downPayment && parsedData.propertyValue && (parsedData.downPayment / parsedData.propertyValue) < 0.2 ? 150 : 0),
    estimatedTaxes: quote.estimatedTaxes || 450,
    estimatedInsurance: quote.estimatedInsurance || 180,
    totalMonthlyPayment: quote.totalMonthlyPayment || (quote.monthlyPayment + (parsedData.monthlyMI || 0) + (quote.estimatedTaxes || 450) + (quote.estimatedInsurance || 180))
  }

  useEffect(() => {
    setShowChat(initialShowChat)
  }, [initialShowChat])

  const handleScheduleCall = async (time: Date) => {
    try {
      const response = await fetch('/api/scheduled-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          scheduledAt: time.toISOString(),
          memo: `Discuss quote details - Interest Rate: ${quote.interestRate}%, Term: ${quote.loanTerm} years, Monthly Payment: $${quote.monthlyPayment.toLocaleString()}`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule call')
      }

      const scheduledCall = await response.json()

      toast({
        title: "Call Scheduled",
        description: `Phone call scheduled with ${quote.lender.name} for ${time.toLocaleString()}. Check your email for details.`,
      })
    } catch (error) {
      console.error('Error scheduling call:', error)
      toast({
        title: "Error",
        description: "Failed to schedule call. Please try again.",
        variant: "destructive"
      })
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Key Loan Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Interest Rate</p>
            <p className="text-lg font-semibold">{quote.interestRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">APR</p>
            <p className="text-lg font-semibold">{loanDetails.apr.toFixed(3)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Loan Term</p>
            <p className="text-lg font-semibold">{quote.loanTerm} years</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Principal & Interest</p>
            <p className="text-lg font-semibold">${quote.monthlyPayment.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Monthly Payment Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Principal & Interest</span>
            <span className="text-sm font-medium">${quote.monthlyPayment.toLocaleString()}</span>
          </div>
          {loanDetails.pmi > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Private Mortgage Insurance (PMI)</span>
              <span className="text-sm font-medium">${loanDetails.pmi.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Estimated Property Taxes</span>
            <span className="text-sm font-medium">${loanDetails.estimatedTaxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Estimated Insurance</span>
            <span className="text-sm font-medium">${loanDetails.estimatedInsurance.toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-sm">Total Monthly Payment</span>
              <span className="text-sm">${loanDetails.totalMonthlyPayment.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-primary-50 p-4 rounded-lg border-2 border-primary-200">
        <h4 className="text-sm font-medium text-primary-900 mb-4">Contact Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <p className="text-xs text-primary-600">Phone</p>
              <p className="text-sm font-medium">{lender.phoneNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-xs text-primary-600">Email</p>
              <p className="text-sm font-medium">{lender.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <p className="text-xs text-primary-600">Company</p>
              <p className="text-sm font-medium">{lender.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-xs text-primary-600">License</p>
              <p className="text-sm font-medium">{lender.licenseNumber}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary-200">
          <p className="text-xs text-primary-600">About</p>
          <p className="text-sm">{lender.bio}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Loan Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Property Value</span>
            <span className="text-sm font-medium">
              ${loanDetails.propertyValue.toLocaleString()}
              {parsedData.percentage > 0 && ` (based on ${parsedData.percentage}% down payment)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Down Payment</span>
            <span className="text-sm font-medium">
              ${loanDetails.downPayment.toLocaleString()}
              {parsedData.percentage > 0 && ` (${parsedData.percentage}%)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Loan Amount</span>
            <span className="text-sm font-medium">
              ${loanDetails.loanAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Cash Needed</span>
            <span className="text-sm font-medium">${(loanDetails.downPayment + loanDetails.closingCosts).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Loan-to-Value Ratio</span>
            <span className="text-sm font-medium">
              {((loanDetails.loanAmount / loanDetails.propertyValue) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {quote.additionalNotes && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Additional Notes</h4>
          <p className="text-sm whitespace-pre-wrap">{quote.additionalNotes}</p>
        </div>
      )}
    </div>
  )

  const renderCostsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Closing Costs Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Closing Costs</span>
            <span className="text-sm font-medium">${loanDetails.closingCosts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Estimated Per Month (if financed)</span>
            <span className="text-sm font-medium">
              ${((loanDetails.closingCosts / quote.loanTerm) / 12).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>Includes: Title Insurance, Appraisal, Credit Report, Origination Fees, Recording Fees</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Required Funds</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Down Payment</span>
            <span className="text-sm font-medium">
              ${loanDetails.downPayment.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Closing Costs</span>
            <span className="text-sm font-medium">${loanDetails.closingCosts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Escrow Prepaids</span>
            <span className="text-sm font-medium">$4,500</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-sm">Total Funds Needed</span>
              <span className="text-sm">
                ${(loanDetails.downPayment + loanDetails.closingCosts + 4500).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Annual Costs</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Estimated Annual Property Taxes</span>
            <span className="text-sm font-medium">${(loanDetails.estimatedTaxes * 12).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Estimated Annual Insurance</span>
            <span className="text-sm font-medium">${(loanDetails.estimatedInsurance * 12).toLocaleString()}</span>
          </div>
          {loanDetails.pmi > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Annual PMI</span>
              <span className="text-sm font-medium">${(loanDetails.pmi * 12).toLocaleString()}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-sm">Total Annual Costs</span>
              <span className="text-sm">
                ${((loanDetails.estimatedTaxes + loanDetails.estimatedInsurance + loanDetails.pmi) * 12).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-6xl bg-white rounded-xl shadow-xl">
          <div className="flex h-[80vh]">
            {/* Left side - Quote Details */}
            <div className={`${showChat ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <Dialog.Title className="text-xl font-semibold">
                      Quote Details
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      From {quote.lender.name || 'Unknown'} {quote.lender.company ? `at ${quote.lender.company}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'overview'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'details'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Loan Details
                  </button>
                  <button
                    onClick={() => setActiveTab('costs')}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'costs'
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Costs & Fees
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'details' && renderDetailsTab()}
                {activeTab === 'costs' && renderCostsTab()}
              </div>

              {quote.status === 'PENDING' && (
                <div className="p-6 border-t">
                  <QuoteDisclaimer className="mb-6" />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onDecline}
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200"
                    >
                      Decline Quote
                    </button>
                    {!showChat && (
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                      >
                        Chat with Assistant
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onAccept}
                      disabled={!hasConversation}
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasConversation ? 'Accept Quote' : 'Chat Required Before Accepting'}
                    </button>
                  </div>

                  {!hasConversation && (
                    <p className="text-sm text-red-600 mt-2 text-right">
                      Please chat with the assistant before accepting the quote
                    </p>
                  )}
                </div>
              )}
              {quote.status === 'DECLINED' && (
                <div className="p-6 border-t">
                  <div className="flex justify-end">
                    <p className="text-sm text-red-600">
                      This quote has been declined and cannot be modified
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Chat */}
            {showChat && quote.status !== 'DECLINED' && (
              <div className="w-1/2 border-l border-gray-200 flex flex-col">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-medium">Chat with Loan Assistant</h3>
                  <p className="text-sm text-gray-500">
                    Ask questions and get detailed information about your quote
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <LoanAgentChat
                    lenderId={quote.lenderId}
                    quoteLoanAmount={quote.loanAmount || (quote.monthlyPayment * quote.loanTerm * 12)}
                    quoteInterestRate={quote.interestRate}
                    lenderName={quote.lender.name}
                    onScheduleCall={handleScheduleCall}
                    quoteDetails={{
                      loanTerm: quote.loanTerm,
                      monthlyPayment: quote.monthlyPayment,
                      propertyValue: quote.propertyValue,
                      downPayment: quote.downPayment,
                      pmi: quote.pmi,
                      estimatedTaxes: quote.estimatedTaxes,
                      estimatedInsurance: quote.estimatedInsurance
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 
