import { Suspense } from 'react'
import AdminDashboardClient from './AdminDashboardClient'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <AdminDashboardClient />
        </Suspense>
      </div>
    </div>
  )
} 