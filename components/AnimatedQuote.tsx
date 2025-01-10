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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, index * 500) // 500ms delay between each quote
    return () => clearTimeout(timer)
  }, [index])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className={`bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col h-full ${
        quote.status === 'DECLINED' && !isExpanded ? 'cursor-pointer' : ''
      }`}
      onClick={() => {
        if (quote.status === 'DECLINED' && !isExpanded) {
          setIsExpanded(true)
        }
      }}
    >
      {quote.status === 'DECLINED' && !isExpanded ? (
        // Collapsed view for declined quotes
        <div className="flex justify-between items-center">
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
        // Full view for active quotes or expanded declined quotes
        <>
          <div className="flex justify-between items-start mb-4">
            {quote.status === 'ACCEPTED' ? (
              // Expanded layout for accepted quotes
              <div className="w-full">
                <div className="relative">
                  {/* Top Banner Section */}
                  <div className="absolute top-0 right-0 left-0 h-24 bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-lg -mx-6 -mt-6" />
                  
                  {/* Content Container */}
                  <div className="relative pt-8 px-2">
                    {/* Lender Information Section */}
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                        {/* Placeholder for lender photo */}
                        <span className="text-2xl font-semibold text-gray-500">LP</span>
                      </div>
                      <div className="flex-1 text-white pt-2">
                        <h4 className="text-2xl font-semibold">{quote.lender.name || 'Lender Name'}</h4>
                        <p className="text-primary-100">{quote.lender.company || 'Company Name'}</p>
                      </div>
                      <div className="pt-2">
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          Accepted Quote
                        </span>
                      </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="mt-12 grid grid-cols-12 gap-6">
                      {/* Left Column - Loan Details */}
                      <div className="col-span-8 space-y-6">
                        {/* Key Details */}
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

                        {/* Contact Information */}
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
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">License Number</p>
                                <p className="text-sm font-medium">{quote.lender.licenseNumber || 'Pending'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Next Steps & Actions */}
                      <div className="col-span-4 space-y-6">
                        {/* Next Steps Card */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h5>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-600">Quote Accepted</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              </div>
                              <span className="text-sm text-gray-600">Submit Documents</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              </div>
                              <span className="text-sm text-gray-600">Property Appraisal</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Regular view for non-accepted quotes
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
            )}
            {quote.status !== 'ACCEPTED' && (
              <div className="flex items-center gap-2">
                {quote.status === 'DECLINED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(false)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Collapse
                  </button>
                )}
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    quote.status === 'DECLINED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {quote.status === 'DECLINED' ? 'Declined' : 'Pending'}
                </span>
              </div>
            )}
          </div>

          {quote.status !== 'ACCEPTED' && (
            <>
              <div className="flex-grow">
                <p className="text-sm font-medium mb-2">Monthly Payment</p>
                <p className="text-2xl font-bold mb-4">
                  ${quote.monthlyPayment.toLocaleString()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetails(quote)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 mb-4"
                >
                  View Details
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {quote.status === 'PENDING' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAccept(quote.id)
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                    >
                      Accept Quote
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDecline(quote.id)
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Decline
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onChat(quote, quote.quoteRequestId)
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 flex items-center justify-center gap-2"
                >
                  Chat with Lender
                  {unreadMessages > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  )
} 