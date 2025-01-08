'use client'

import { useState } from 'react'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface User {
  id: number
  email: string
  role: string
  isManager: boolean
  createdAt: string
}

export default function AdminDashboardClient() {
  const [users, setUsers] = useState<User[]>([])
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [registrationCode, setRegistrationCode] = useState('')

  const generateRegistrationCode = async (type: 'LENDER' | 'LENDER_TEAM') => {
    setIsGeneratingCode(true)
    try {
      const response = await fetch('/api/admin/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setRegistrationCode(data.code)
      }
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Generate Registration Codes</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => generateRegistrationCode('LENDER_TEAM')}
              disabled={isGeneratingCode}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Generate Team Code
            </button>
          </div>
          <div>
            <button
              onClick={() => generateRegistrationCode('LENDER')}
              disabled={isGeneratingCode}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Generate Lender Code
            </button>
          </div>
          {registrationCode && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Registration Code:</p>
              <p className="text-lg font-mono font-medium">{registrationCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 