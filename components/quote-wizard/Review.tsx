'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: any
  onSubmit: () => Promise<void>
  onBack: () => void
  onEdit: (step: number) => void
}

interface Section {
  title: string
  step: number
  fields: {
    label: string
    value: string | number
    format?: (value: any) => string
  }[]
}

const Section = ({ title, children, stepNumber, onEdit }: { 
  title: string
  children: React.ReactNode
  stepNumber: number
  onEdit: (step: number) => void 
}) => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <Button
        variant="ghost"
        onClick={() => onEdit(stepNumber)}
        className="text-primary hover:text-primary/90 text-sm font-medium"
      >
        Edit
      </Button>
    </div>
    {children}
  </div>
)

export default function Review({ data, onSubmit, onBack, onEdit }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Calculate monthly income
  const monthlyIncome = data.annualIncome / 12

  // Calculate monthly obligations
  const monthlyObligations = 
    Number(data.monthlyCarLoan || 0) + 
    Number(data.monthlyCreditCard || 0) + 
    Number(data.monthlyOtherExpenses || 0)

  // Calculate DTI
  const debtToIncomeRatio = monthlyIncome > 0 
    ? (monthlyObligations / monthlyIncome) * 100 
    : 0

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError('')
      await onSubmit()
    } catch (err) {
      console.error('Error submitting quote request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit quote request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
        <p className="mt-2 text-gray-600">Please review all information before submitting</p>
      </div>

      <div className="space-y-4">
        <Section title="Property Information" stepNumber={0} onEdit={onEdit}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Purchase Price</p>
                <p className="font-medium">{formatCurrency(data.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Down Payment</p>
                <p className="font-medium">
                  {formatCurrency(data.downPaymentAmount)} ({((data.downPaymentAmount / data.purchasePrice) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            {data.propertyAddress && (
              <div>
                <p className="text-sm text-gray-500">Property Address</p>
                <p className="font-medium">{data.propertyAddress}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">State</p>
                <p className="font-medium">{data.propertyState}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ZIP Code</p>
                <p className="font-medium">{data.propertyZipCode}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Loan-to-Value Ratio</p>
              <p className={`font-medium ${((data.purchasePrice - data.downPaymentAmount) / data.purchasePrice) * 100 > 95 ? 'text-amber-600' : 'text-green-600'}`}>
                {((data.purchasePrice - data.downPaymentAmount) / data.purchasePrice * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Section>

        <Section title="Credit Profile" stepNumber={1} onEdit={onEdit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Credit Score</p>
              <p className="font-medium">{data.creditScore}</p>
            </div>
          </div>
        </Section>

        <Section title="Employment & Income" stepNumber={2} onEdit={onEdit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employment Status</p>
              <p className="font-medium">{data.employmentStatus.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Years at Current Job</p>
              <p className="font-medium">{data.employmentYears} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Annual Income</p>
              <p className="font-medium">{formatCurrency(data.annualIncome)}/year</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="font-medium text-green-600">{formatCurrency(monthlyIncome)}/month</p>
            </div>
          </div>
        </Section>

        <Section title="Monthly Obligations" stepNumber={3} onEdit={onEdit}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Car Loan</p>
                <p className="font-medium">{formatCurrency(data.monthlyCarLoan || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Credit Cards</p>
                <p className="font-medium">{formatCurrency(data.monthlyCreditCard || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Other Expenses</p>
                <p className="font-medium">{formatCurrency(data.monthlyOtherExpenses || 0)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Monthly Obligations</p>
              <p className="font-medium text-amber-600">{formatCurrency(monthlyObligations)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Debt-to-Income Ratio</p>
              <p className={`font-medium ${debtToIncomeRatio > 43 ? 'text-red-600' : 'text-green-600'}`}>
                {debtToIncomeRatio.toFixed(1)}%
              </p>
            </div>
          </div>
        </Section>
      </div>

      {error && (
        <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
        </Button>
      </div>
    </div>
  )
} 