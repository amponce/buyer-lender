'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import AIConfigForm from './AIConfigForm'
import QuoteRequestList from './QuoteRequestList'

export default function LenderDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'ai'>('requests')

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Mortgage Quote System</h1>
            </div>
            <div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Quote Requests
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'ai'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              AI Configuration
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'requests' ? (
            <QuoteRequestList />
          ) : (
            <AIConfigForm />
          )}
        </div>
      </div>
    </div>
  )
} 