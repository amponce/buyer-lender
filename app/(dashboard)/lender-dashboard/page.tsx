import { Suspense } from 'react'
import LenderDashboardClient from './LenderDashboardClient'
import { getQuoteRequests } from '@/lib/data'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LenderDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'LENDER') {
    redirect('/login')
  }

  const quoteRequests = await getQuoteRequests()
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Lender Dashboard</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <LenderDashboardClient initialQuoteRequests={quoteRequests} />
        </Suspense>
      </div>
    </div>
  )
} 