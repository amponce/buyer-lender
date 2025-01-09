'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function AIConfigForm() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAutopilotActive, setIsAutopilotActive] = useState(false)

  const [formData, setFormData] = useState({
    rateSheet: '',
    guidelines: '',
    productInfo: '',
    faqResponses: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/lender/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isAutopilotActive
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      setSuccess('AI profile updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update AI profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-4">AI Assistant Configuration</h2>
        <div className="flex items-center mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAutopilotActive}
              onChange={e => setIsAutopilotActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">Enable AI Autopilot</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rate Sheet</label>
            <p className="text-sm text-gray-500 mb-2">
              Enter your current rates and terms. Format: JSON with rate tiers, loan types, and requirements.
            </p>
            <textarea
              name="rateSheet"
              value={formData.rateSheet}
              onChange={handleChange}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder='{
  "conventional": {
    "30_year": {
      "excellent_credit": 6.25,
      "good_credit": 6.5
    }
  }
}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lending Guidelines</label>
            <p className="text-sm text-gray-500 mb-2">
              Describe your lending criteria, requirements, and restrictions.
            </p>
            <textarea
              name="guidelines"
              value={formData.guidelines}
              onChange={handleChange}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Minimum credit score: 620
Maximum DTI: 43%
Documentation required: Last 2 years W2s, 3 months bank statements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Products</label>
            <p className="text-sm text-gray-500 mb-2">
              List and describe available loan products and their features.
            </p>
            <textarea
              name="productInfo"
              value={formData.productInfo}
              onChange={handleChange}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="1. Conventional 30-year fixed
2. FHA loans with 3.5% down
3. VA loans with 100% financing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">FAQ Responses</label>
            <p className="text-sm text-gray-500 mb-2">
              Common questions and your preferred responses.
            </p>
            <textarea
              name="faqResponses"
              value={formData.faqResponses}
              onChange={handleChange}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Q: What documents do I need?
A: Generally, we need your last 2 years of W2s...

Q: How long does the process take?
A: Typically 30 days from application to closing..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-600 text-sm">{success}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Configuration'}
      </button>
    </form>
  )
} 