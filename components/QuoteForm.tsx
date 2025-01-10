'use client'

import { useState } from 'react'

interface QuoteFormProps {
  quoteRequest: {
    id: string
    purchasePrice: number
    propertyState: string
    propertyZipCode: string
    creditScore: number
    annualIncome: number
    monthlyCarLoan: number
    monthlyCreditCard: number
    monthlyOtherExpenses: number
  }
  onSubmit: (quoteData: {
    interestRate: number
    loanTerm: number
    monthlyPayment: number
    additionalNotes?: string
  }) => void
  onCancel: () => void
}

export default function QuoteForm({ quoteRequest, onSubmit, onCancel }: QuoteFormProps) {
  const [interestRate, setInterestRate] = useState(6.25)
  const [loanTerm, setLoanTerm] = useState(30)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [closingCosts, setClosingCosts] = useState(12000)
  const [estimatedTaxes, setEstimatedTaxes] = useState(450)
  const [estimatedInsurance, setEstimatedInsurance] = useState(180)

  // Derived calculations
  const downPayment = (quoteRequest.purchasePrice * downPaymentPercent) / 100
  const loanAmount = quoteRequest.purchasePrice - downPayment
  const monthlyInterestRate = interestRate / 1200 // Convert annual rate to monthly decimal
  const numberOfPayments = loanTerm * 12

  // Calculate monthly payment using amortization formula
  const monthlyPayment = loanAmount * (
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
  )

  // Calculate PMI (if down payment < 20%)
  const pmi = downPaymentPercent < 20 ? 150 : 0

  // Total monthly payment including taxes, insurance, and PMI
  const totalMonthlyPayment = monthlyPayment + estimatedTaxes + estimatedInsurance + pmi

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Format additional notes with structured data
    const additionalNotes = `Loan Details:
• Down Payment: $${downPayment.toLocaleString()} (${downPaymentPercent}%)
• Loan Amount: $${loanAmount.toLocaleString()}
• Term: ${loanTerm} years at ${interestRate}%

Monthly Payment Breakdown:
• Principal & Interest: $${Math.round(monthlyPayment).toLocaleString()}
• Property Taxes: $${estimatedTaxes}
• Insurance: $${estimatedInsurance}
• PMI: $${pmi}
• Total Payment: $${Math.round(totalMonthlyPayment).toLocaleString()}

Closing Costs:
• Estimated Amount: $${closingCosts.toLocaleString()}
• Total Cash Needed: $${(downPayment + closingCosts).toLocaleString()}`

    onSubmit({
      interestRate,
      loanTerm,
      monthlyPayment: totalMonthlyPayment,
      additionalNotes
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Buyer Information Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Credit Score:</span> {quoteRequest.creditScore}
            </div>
            <div>
              <span className="font-medium">Annual Income:</span> ${quoteRequest.annualIncome.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Monthly Debt:</span> ${(
                quoteRequest.monthlyCarLoan +
                quoteRequest.monthlyCreditCard +
                quoteRequest.monthlyOtherExpenses
              ).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Loan Details Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Loan Details</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.125"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (years)
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={30}>30 Years</option>
                <option value={20}>20 Years</option>
                <option value={15}>15 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Down Payment (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="3"
                max="100"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Costs ($)
              </label>
              <input
                type="number"
                step="100"
                value={closingCosts}
                onChange={(e) => setClosingCosts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Monthly Taxes ($)
              </label>
              <input
                type="number"
                step="10"
                value={estimatedTaxes}
                onChange={(e) => setEstimatedTaxes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Monthly Insurance ($)
              </label>
              <input
                type="number"
                step="10"
                value={estimatedInsurance}
                onChange={(e) => setEstimatedInsurance(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Monthly Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(monthlyPayment).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">principal & interest</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Total Monthly</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(totalMonthlyPayment).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">including taxes & insurance</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Cash Needed</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(downPayment + closingCosts).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">down payment & closing costs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          Submit Quote
        </button>
      </div>
    </form>
  )
} 