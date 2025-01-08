'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { formatCurrency } from '@/lib/utils'
import { initializeSocket } from '@/lib/socket'

interface QuoteRequest {
  id: string
  creditScore: number
  annualIncome: number
  additionalIncome: number
  monthlyCarLoan: number
  monthlyCreditCard: number
  monthlyOtherExpenses: number
  purchasePrice: number
  propertyState: string
  propertyZipCode: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    interestRate: number
    loanTerm: number
    monthlyPayment: number
    additionalNotes?: string
  }) => void
  quoteRequest: QuoteRequest
}

export default function QuoteModal({ isOpen, onClose, onSubmit, quoteRequest }: Props) {
  const [interestRate, setInterestRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('30')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate monthly payment when interest rate or loan term changes
  useEffect(() => {
    if (interestRate && loanTerm) {
      const rate = parseFloat(interestRate) / 100 / 12 // Monthly interest rate
      const term = parseInt(loanTerm) * 12 // Total number of payments
      const principal = quoteRequest.purchasePrice

      if (!isNaN(rate) && rate > 0) {
        const payment = (principal * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1)
        setMonthlyPayment(payment.toFixed(2))
      }
    }
  }, [interestRate, loanTerm, quoteRequest.purchasePrice])

  // Initialize WebSocket
  useEffect(() => {
    if (isOpen) {
      initializeSocket()
    }
  }, [isOpen])

  const validateQuote = () => {
    const rate = parseFloat(interestRate)
    const term = parseInt(loanTerm)
    const payment = parseFloat(monthlyPayment)
    const monthlyIncome = (quoteRequest.annualIncome + quoteRequest.additionalIncome) / 12
    const totalMonthlyDebt = quoteRequest.monthlyCarLoan + 
                            quoteRequest.monthlyCreditCard + 
                            quoteRequest.monthlyOtherExpenses + 
                            payment

    if (isNaN(rate) || rate <= 0 || rate >= 15) {
      setError('Interest rate must be between 0% and 15%')
      return false
    }

    if (isNaN(term) || ![15, 20, 30].includes(term)) {
      setError('Please select a valid loan term')
      return false
    }

    if (isNaN(payment) || payment <= 0) {
      setError('Please enter a valid monthly payment')
      return false
    }

    // Check debt-to-income ratio (should be less than 43% for qualified mortgage)
    const dti = (totalMonthlyDebt / monthlyIncome) * 100
    if (dti > 43) {
      setError(`Debt-to-income ratio (${dti.toFixed(1)}%) exceeds 43% maximum`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateQuote()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      await onSubmit({
        interestRate: parseFloat(interestRate),
        loanTerm: parseInt(loanTerm),
        monthlyPayment: parseFloat(monthlyPayment),
        additionalNotes: additionalNotes.trim() || undefined
      })

      // Reset form
      setInterestRate('')
      setLoanTerm('30')
      setMonthlyPayment('')
      setAdditionalNotes('')
      onClose()
    } catch (err) {
      console.error('Error submitting quote:', err)
      setError('Failed to submit quote. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Submit Quote
          </Dialog.Title>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-gray-500">Purchase Price</label>
              <div className="font-medium">{formatCurrency(quoteRequest.purchasePrice)}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Credit Score</label>
              <div className="font-medium">{quoteRequest.creditScore}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Annual Income</label>
              <div className="font-medium">{formatCurrency(quoteRequest.annualIncome)}</div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Monthly Debt</label>
              <div className="font-medium">
                {formatCurrency(
                  quoteRequest.monthlyCarLoan +
                  quoteRequest.monthlyCreditCard +
                  quoteRequest.monthlyOtherExpenses
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.125"
                min="0"
                max="15"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter rate in percentage (e.g., 6.25 for 6.25%)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loan Term (years)
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="30">30 years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Monthly Payment
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
              {monthlyPayment && (
                <p className="mt-1 text-sm text-gray-500">
                  Principal & Interest: {formatCurrency(parseFloat(monthlyPayment))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Optional: Add any additional information about the quote..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quote'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 