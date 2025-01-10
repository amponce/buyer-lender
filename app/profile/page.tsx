'use client'

import ProfileForm from '@/components/ProfileForm'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session } = useSession()
  const dashboardPath = session?.user?.role === 'LENDER' ? '/admin-dashboard' : '/buyer-dashboard'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <Link
              href={dashboardPath}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal information and preferences.
          </p>
        </div>
        
        <ProfileForm />
      </div>
    </div>
  )
} 