'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import QuoteWizardClient from '@/components/quote-wizard/QuoteWizardClient'

export default function QuoteRequestForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseText = await response.text()
      console.log('Raw response text:', responseText)

      if (!response.ok) {
        let errorMessage = 'Failed to submit quote'
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            console.error('Error parsing response:', e)
          }
        }
        throw new Error(errorMessage)
      }

      router.push('/buyer-dashboard')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit quote')
      console.error('Error submitting quote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      <QuoteWizardClient onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  )
} 