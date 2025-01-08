'use client'

import { useState } from 'react'
import PersonalInfo from '@/components/quote-wizard/steps/PersonalInfo'
import IncomeInfo from '@/components/quote-wizard/steps//IncomeInfo'
import Obligations from '@/components/quote-wizard/steps/Obligations'
import PropertyInfo from '@/components/quote-wizard/steps//PropertyInfo'
import Review from '@/components/quote-wizard/steps/Review'
import ProgressBar from '@/components/quote-wizard/ProgressBar'

const STEPS = [
  { title: 'Personal Info', description: 'Basic information and credit score' },
  { title: 'Income', description: 'Your income sources' },
  { title: 'Obligations', description: 'Current financial obligations' },
  { title: 'Property', description: 'Property details' },
  { title: 'Review', description: 'Review and submit' }
]

interface Props {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export default function QuoteWizardClient({ onSubmit }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    creditScore: '',
    annualIncome: '',
    additionalIncome: '',
    monthlyCarLoan: '',
    monthlyCreditCard: '',
    monthlyOtherExpenses: '',
    purchasePrice: '',
    propertyAddress: '',
    propertyState: '',
    propertyZipCode: ''
  })

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleSubmit = () => {
    const transformedData = {
      ...formData,
      creditScore: parseInt(formData.creditScore),
      annualIncome: parseFloat(formData.annualIncome),
      additionalIncome: parseFloat(formData.additionalIncome || '0'),
      monthlyCarLoan: parseFloat(formData.monthlyCarLoan || '0'),
      monthlyCreditCard: parseFloat(formData.monthlyCreditCard || '0'),
      monthlyOtherExpenses: parseFloat(formData.monthlyOtherExpenses || '0'),
      purchasePrice: parseFloat(formData.purchasePrice),
    }
    onSubmit(transformedData)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfo data={formData} updateData={updateFormData} onNext={nextStep} />
      case 1:
        return <IncomeInfo data={formData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} />
      case 2:
        return <Obligations data={formData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} />
      case 3:
        return <PropertyInfo data={formData} updateData={updateFormData} onNext={nextStep} onBack={prevStep} />
      case 4:
        return <Review 
          data={formData} 
          onSubmit={handleSubmit}
          onBack={prevStep}
          onEdit={setCurrentStep}
        />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Submit Quote Request
      </h1>
      <div className="mb-12">
        <ProgressBar steps={STEPS} currentStep={currentStep} />
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        {renderStep()}
      </div>
    </div>
  )
} 