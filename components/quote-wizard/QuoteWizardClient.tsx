'use client'

import { cn } from '@/lib/ui-utils'

interface Step {
  title: string
  description: string
}

const steps: Step[] = [
  {
    title: 'Property Details',
    description: 'Enter property information',
  },
  {
    title: 'Financial Information',
    description: 'Enter your financial details',
  },
  {
    title: 'Review & Submit',
    description: 'Review your information',
  },
]

interface Props {
  currentStep: number
  onStepChange: (step: number) => void
}

export default function QuoteWizardStepper({ currentStep, onStepChange }: Props) {
  return (
    <div className="w-full py-6 mb-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Progress">
          <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
            {steps.map((step, index) => (
              <li key={step.title} className="md:flex-1">
                <button
                  onClick={() => index <= currentStep && onStepChange(index)}
                  className={cn(
                    'group flex w-full flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4',
                    index <= currentStep
                      ? 'cursor-pointer border-primary hover:border-primary/70'
                      : 'cursor-not-allowed border-gray-200',
                    index === currentStep && 'border-primary'
                  )}
                  disabled={index > currentStep}
                >
                  <span className="text-sm font-medium">
                    Step {index + 1}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      index <= currentStep ? 'text-primary' : 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="text-sm text-gray-500">
                    {step.description}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
} 