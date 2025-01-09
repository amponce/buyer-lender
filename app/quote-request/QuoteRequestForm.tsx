'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import InfoTooltip from '@/components/InfoTooltip'
import { US_STATES } from '@/lib/constants'
import Review from '@/components/quote-wizard/Review'

const quoteRequestSchema = z.object({
  propertyAddress: z.string().min(1, 'Property address is required'),
  propertyCity: z.string().min(1, 'City is required'),
  propertyState: z.string().min(2, 'State is required'),
  propertyZipCode: z.string().min(5, 'Valid ZIP code is required'),
  purchasePrice: z.coerce.number().min(1, 'Purchase price is required'),
  downPaymentAmount: z.coerce.number()
    .min(0, 'Down payment cannot be negative')
    .refine(
      (val) => val >= 0,
      'Down payment must be at least 0'
    ),
  creditScore: z.coerce.number().min(300).max(850),
  annualIncome: z.coerce.number().min(1, 'Annual income is required'),
  monthlyCarLoan: z.coerce.number().min(0),
  monthlyCreditCard: z.coerce.number().min(0),
  monthlyOtherExpenses: z.coerce.number().min(0),
  employmentStatus: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'RETIRED', 'OTHER']),
  employmentYears: z.coerce.number().min(0),
  employmentHistory: z.array(z.object({
    employer: z.string(),
    position: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(),
    currentJob: z.boolean(),
    monthlyIncome: z.number()
  })).optional()
})

export type FormData = z.infer<typeof quoteRequestSchema>

interface FormStep {
  title: string
  description: string
  fields: (keyof FormData)[]
  tooltips: Record<string, string>
}

const steps: FormStep[] = [
  {
    title: "Let's start with the property",
    description: "Tell us about the home you want to buy",
    fields: ['propertyAddress', 'propertyCity', 'propertyState', 'propertyZipCode', 'purchasePrice', 'downPaymentAmount'],
    tooltips: {
      propertyAddress: 'Enter the full street address of the property',
      purchasePrice: 'The agreed-upon purchase price for the property',
      downPaymentAmount: 'How much you plan to put down. Enter 0 if you need down payment assistance.',
    }
  },
  {
    title: 'Your credit profile',
    description: 'This helps us match you with the right lenders',
    fields: ['creditScore'],
    tooltips: {
      creditScore: "You can find this on Credit Karma or your credit card statement",
    }
  },
  {
    title: 'Employment & Income',
    description: 'Tell us about your work and earnings',
    fields: ['employmentStatus', 'employmentYears', 'annualIncome'],
    tooltips: {
      employmentStatus: 'Your current employment situation',
      employmentYears: 'Number of years at your current job',
      annualIncome: 'Your total annual income before taxes',
    }
  },
  {
    title: 'Monthly obligations',
    description: 'Help us understand your current financial commitments',
    fields: ['monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses'],
    tooltips: {
      monthlyCarLoan: 'Total monthly car payments',
      monthlyCreditCard: 'Total monthly credit card payments',
      monthlyOtherExpenses: 'Other monthly payments like student loans or personal loans',
    }
  }
]

export default function QuoteRequestForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReview, setShowReview] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      propertyAddress: '',
      propertyCity: '',
      propertyState: '',
      propertyZipCode: '',
      purchasePrice: 0,
      downPaymentAmount: 0,
      creditScore: 0,
      annualIncome: 0,
      monthlyCarLoan: 0,
      monthlyCreditCard: 0,
      monthlyOtherExpenses: 0,
      employmentStatus: 'EMPLOYED',
      employmentYears: 0,
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      const formData = {
        ...data,
        // Ensure all number fields are properly converted
        creditScore: Number(data.creditScore),
        annualIncome: Number(data.annualIncome),
        monthlyCarLoan: Number(data.monthlyCarLoan),
        monthlyCreditCard: Number(data.monthlyCreditCard),
        monthlyOtherExpenses: Number(data.monthlyOtherExpenses),
        purchasePrice: Number(data.purchasePrice),
        downPaymentAmount: Number(data.downPaymentAmount),
        employmentYears: Number(data.employmentYears)
      }
      
      console.log('Form data before submission:', {
        ...formData,
        validations: {
          creditScore: !isNaN(formData.creditScore),
          annualIncome: !isNaN(formData.annualIncome),
          monthlyCarLoan: !isNaN(formData.monthlyCarLoan),
          monthlyCreditCard: !isNaN(formData.monthlyCreditCard),
          monthlyOtherExpenses: !isNaN(formData.monthlyOtherExpenses),
          purchasePrice: !isNaN(formData.purchasePrice),
          downPaymentAmount: !isNaN(formData.downPaymentAmount),
          employmentYears: !isNaN(formData.employmentYears)
        }
      })
      
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to submit quote request'
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      router.push('/buyer-dashboard')
    } catch (err) {
      console.error('Error submitting quote request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit quote request')
    } finally {
      setIsLoading(false)
    }
  }

  const currentFields = steps[currentStep].fields
  const isLastStep = currentStep === steps.length - 1

  const handleNext = async () => {
    const isValid = await form.trigger(currentFields as any[])
    if (isValid) {
      if (isLastStep) {
        setShowReview(true)
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  if (showReview) {
    return (
      <Review
        data={form.getValues()}
        onSubmit={form.handleSubmit(onSubmit)}
        onBack={() => setShowReview(false)}
        onEdit={(step) => {
          setCurrentStep(step)
          setShowReview(false)
        }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h1>
        <p className="text-gray-600 mt-1">{steps[currentStep].description}</p>
      </div>

      <div className="mb-12">
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="absolute left-0 h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="relative z-10 flex justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              return (
                <div key={step.title} className="flex flex-col items-center">
                  <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer
                      transition-all duration-300 ease-in-out
                      ${isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                        isCompleted ? 'bg-primary text-primary-foreground' :
                        'bg-background border-2 border-gray-300 text-gray-500'
                      }
                    `}
                    onClick={() => {
                      if (isCompleted) {
                        setCurrentStep(index)
                      }
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className={`
                    mt-2 text-sm font-medium whitespace-nowrap cursor-pointer
                    ${isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-gray-500'}
                  `}
                  onClick={() => {
                    if (isCompleted) {
                      setCurrentStep(index)
                    }
                  }}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {currentFields.map((field) => {
              const fieldError = form.formState.errors[field]?.message
              return (
                <div key={field} className={field === 'propertyAddress' ? 'md:col-span-2' : ''}>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      {field === 'downPaymentAmount' ? 'Down Payment' : field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      {steps[currentStep].tooltips[field] && (
                        <InfoTooltip content={steps[currentStep].tooltips[field]} />
                      )}
                    </label>
                    {field === 'employmentStatus' ? (
                      <Select
                        value={form.watch(field)}
                        onValueChange={(value) => form.setValue(field, value as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMPLOYED">Employed</SelectItem>
                          <SelectItem value="SELF_EMPLOYED">Self Employed</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : field === 'propertyState' ? (
                      <Select
                        value={form.watch(field)}
                        onValueChange={(value) => form.setValue(field, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="relative">
                        {['purchasePrice', 'downPaymentAmount', 'annualIncome', 'monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses'].includes(field) && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">$</span>
                        )}
                        <Input
                          {...form.register(field, {
                            valueAsNumber: ['creditScore', 'employmentYears', 'purchasePrice', 'downPaymentAmount', 'annualIncome', 'monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses'].includes(field)
                          })}
                          type={['creditScore', 'employmentYears', 'purchasePrice', 'downPaymentAmount', 'annualIncome', 'monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses'].includes(field) ? 'number' : 'text'}
                          className={['purchasePrice', 'downPaymentAmount', 'annualIncome', 'monthlyCarLoan', 'monthlyCreditCard', 'monthlyOtherExpenses'].includes(field) ? 'pl-8' : ''}
                          placeholder={`Enter ${field === 'downPaymentAmount' ? 'down payment' : field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        />
                      </div>
                    )}
                    {fieldError && (
                      <p className="text-sm text-red-600">{fieldError}</p>
                    )}
                    {field === 'downPaymentAmount' && (
                      <p className="text-sm text-gray-500">
                        Need help with down payment?{' '}
                        <a 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            // TODO: Add down payment assistance info modal
                          }}
                          className="text-primary hover:text-primary/90"
                        >
                          Learn about assistance programs
                        </a>
                      </p>
                    )}
                    {field === 'creditScore' && (
                      <p className="text-sm text-gray-500">
                        Don't know your credit score?{' '}
                        <a 
                          href="https://www.creditkarma.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/90"
                        >
                          Check it for free on Credit Karma
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className={!currentStep ? 'ml-auto' : ''}
            >
              {isLastStep ? 'Review Application' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 