'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Quote, QuoteStatus } from '@/types'

interface Props {
  quote: Quote & {
    status: QuoteStatus
    lender: {
      name?: string
      email?: string
      company?: string
      licenseNumber?: string
    }
  }
  index: number
  onAccept: (quoteId: string) => Promise<void>
  onDecline: (quoteId: string) => Promise<void>
  onChat: (quote: Quote, requestId: string) => void
  onViewDetails: (quote: Quote) => void
  unreadMessages: number
}

export default function AnimatedQuote({
  quote,
  index,
  onAccept,
  onDecline,
  onChat,
  onViewDetails,
  unreadMessages
}: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullView, setShowFullView] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * 500)
    return () => clearTimeout(timer)
  }, [index])

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowFullView(!showFullView)
  }

  const calculateLoanAmount = () => {
    if (quote.loanAmount) return quote.loanAmount;
    if (quote.propertyValue && quote.downPayment) {
      return quote.propertyValue - quote.downPayment;
    }
    return quote.monthlyPayment * quote.loanTerm * 12;
  }

  const calculatePropertyValue = () => {
    if (quote.propertyValue) return quote.propertyValue;
    if (quote.loanAmount && quote.downPayment) {
      return quote.loanAmount + quote.downPayment;
    }
    return calculateLoanAmount() * 1.2; // Estimate based on 20% down
  }

  const calculateDownPayment = () => {
    if (quote.downPayment) return quote.downPayment;
    if (quote.propertyValue && quote.loanAmount) {
      return quote.propertyValue - quote.loanAmount;
    }
    return calculatePropertyValue() * 0.2; // Assume 20% down
  }

  const monthlyTaxes = quote.estimatedTaxes || calculatePropertyValue() * 0.015 / 12; // Estimate 1.5% annual property tax
  const monthlyInsurance = quote.estimatedInsurance || calculatePropertyValue() * 0.003 / 12; // Estimate 0.3% annual insurance
  const monthlyPMI = quote.pmi || (calculateDownPayment() / calculatePropertyValue() < 0.2 ? calculateLoanAmount() * 0.005 / 12 : 0);
  const totalMonthlyPayment = quote.monthlyPayment + monthlyPMI + monthlyTaxes + monthlyInsurance;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={`bg-gray-50 rounded-lg border ${
        showFullView ? 'border-primary-200' : 'border-gray-200'
      } ${quote.status === 'DECLINED' && !isExpanded ? 'cursor-pointer' : ''} ${
        showFullView ? 'col-span-full' : ''
      }`}
      onClick={() => {
        if (quote.status === 'DECLINED' && !isExpanded) {
          setIsExpanded(true)
        }
      }}
    >
      {quote.status === 'DECLINED' && !isExpanded ? (
        // Collapsed view for declined quotes (unchanged)
        <div className="p-6 flex justify-between items-center">
          <div>
            <h4 className="text-lg font-semibold text-gray-500">
              {quote.interestRate}% APR - ${quote.monthlyPayment.toLocaleString()}/mo
            </h4>
            <p className="text-sm text-gray-400">
              Click to expand details
            </p>
          </div>
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Declined
          </span>
        </div>
      ) : (
        <>
          {!showFullView ? (
            // Grid Preview View
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">
                    {quote.interestRate}% APR
                  </h4>
                  <p className="text-sm text-gray-500">
                    {quote.loanTerm} year term
                  </p>
                  <p className="text-xs text-gray-500">
                    from {quote.lender.company || quote.lender.email}
                  </p>
                </div>
                <button
                  onClick={handleExpandClick}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <span>Expand</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex-grow">
                <p className="text-2xl font-bold mb-4">
                  ${quote.monthlyPayment.toLocaleString()}/mo
                </p>
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDetails(quote)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                  >
                    View Details
                  </button>
                  {quote.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAccept(quote.id)
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDecline(quote.id)
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Expanded View (similar to accepted quote view)
            <div className="relative">
              <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-lg" />
              
              <div className="relative p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                      <span className="text-2xl font-semibold text-gray-500">
                        {quote.lender.company?.[0] || 'L'}
                      </span>
                    </div>
                    <div className="flex-1 text-white pt-2">
                      <h4 className="text-2xl font-semibold">{quote.lender.name || 'Lender'}</h4>
                      <p className="text-primary-100">{quote.lender.company || 'Company'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExpandClick}
                    className="text-white hover:text-primary-100 flex items-center gap-1"
                  >
                    <span>Collapse</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>

                <div className="mt-12 grid grid-cols-12 gap-6">
                  <div className="col-span-8 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{quote.interestRate}%</p>
                        <p className="text-xs text-gray-500">APR</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Term Length</p>
                        <p className="text-2xl font-bold text-gray-900">{quote.loanTerm}</p>
                        <p className="text-xs text-gray-500">years</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Monthly Payment</p>
                        <p className="text-2xl font-bold text-gray-900">${quote.monthlyPayment.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">principal & interest</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Down Payment</span>
                          <span className="text-sm font-medium">
                            ${Math.round(calculateDownPayment()).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Property Value</span>
                          <span className="text-sm font-medium">
                            ${Math.round(calculatePropertyValue()).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Loan Amount</span>
                          <span className="text-sm font-medium">
                            ${Math.round(calculateLoanAmount()).toLocaleString()}
                          </span>
                        </div>
                        {monthlyPMI > 0 && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Monthly PMI</span>
                            <span className="text-sm font-medium">${Math.round(monthlyPMI).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Est. Property Taxes</span>
                          <span className="text-sm font-medium">${Math.round(monthlyTaxes).toLocaleString()}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Est. Insurance</span>
                          <span className="text-sm font-medium">${Math.round(monthlyInsurance).toLocaleString()}/mo</span>
                        </div>
                        <div className="pt-3 mt-3 border-t">
                          <div className="flex justify-between font-semibold">
                            <span className="text-sm">Total Monthly Payment</span>
                            <span className="text-sm">
                              ${Math.round(totalMonthlyPayment).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-sm font-medium">{quote.lender.email}</p>
                          </div>
                        </div>
                        {quote.lender.licenseNumber && (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">License Number</p>
                              <p className="text-sm font-medium">{quote.lender.licenseNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-4">
                    <div className="space-y-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewDetails(quote)
                        }}
                        className="w-full px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                      >
                        View Full Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onChat(quote, quote.quoteRequestId)
                        }}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        Chat with Lender
                        {unreadMessages > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </button>
                      {quote.status === 'PENDING' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onAccept(quote.id)
                            }}
                            className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                          >
                            Accept Quote
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDecline(quote.id)
                            }}
                            className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            Decline Quote
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
} 