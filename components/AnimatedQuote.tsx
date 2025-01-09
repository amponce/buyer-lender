'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Quote } from '@/types'

interface Props {
  quote: Quote
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
      className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col h-full"
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
          {quote.status === 'ACCEPTED'
            ? 'Accepted'
            : quote.status === 'DECLINED'
            ? 'Declined'
            : 'Pending'}
        </span>
      </div>

      <div className="flex-grow">
        <p className="text-sm font-medium mb-2">Monthly Payment</p>
        <p className="text-2xl font-bold mb-4">
          ${quote.monthlyPayment.toLocaleString()}
        </p>
        <button
          onClick={() => onViewDetails(quote)}
          className="text-sm text-primary-600 hover:text-primary-700 mb-4"
        >
          View Details
        </button>
      </div>

      <div className="space-y-2 mt-4">
        {quote.status === 'PENDING' && (
          <>
            <button
              onClick={() => onAccept(quote.id)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Accept Quote
            </button>
            <button
              onClick={() => onDecline(quote.id)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Decline
            </button>
          </>
        )}
        <button
          onClick={() => onChat(quote, quote.quoteRequestId)}
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
    </motion.div>
  )
} 