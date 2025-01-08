import { Suspense } from 'react'
import QuoteRequestForm from '@/app/quote-request/QuoteRequestForm'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function QuoteRequestPage() {
  const session = await auth()
  if (!session || session.user.role !== 'BUYER') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <QuoteRequestForm />
        </Suspense>
      </div>
    </div>
  )
} 