import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LenderDashboardClient from './LenderDashboardClient'

export default async function LenderDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'LENDER') {
    redirect('/')
  }

  return <LenderDashboardClient />
} 