'use client'

import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import QuoteRequestForm from '@/app/quote-request/QuoteRequestForm'
import Link from 'next/link'

export default function BuyerDashboard() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    }
  })

  if (session?.user.role !== 'BUYER') {
    redirect('/login')
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Buyer Dashboard</h1>
        <div className="flex gap-4">
          <Link
            href="/quote-request"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            New Quote Request
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
      
      <QuoteRequestForm />
    </div>
  )
} 