'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ScheduledCall {
  id: string
  scheduledAt: string
  memo: string | null
  status: string
  buyer: {
    name: string
    email: string
  }
  lender: {
    name: string
    email: string
    company: string
  }
  quote: {
    interestRate: number
    loanTerm: number
    monthlyPayment: number
  }
}

export default function ScheduledCalls() {
  const { data: session } = useSession()
  const [calls, setCalls] = useState<ScheduledCall[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/scheduled-calls')
      if (!response.ok) throw new Error('Failed to fetch calls')
      const data = await response.json()
      setCalls(data)
    } catch (error) {
      console.error('Error fetching calls:', error)
      toast({
        title: "Error",
        description: "Failed to load scheduled calls",
        variant: "destructive"
      })
    }
  }

  const updateCallStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/scheduled-calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      
      if (!response.ok) throw new Error('Failed to update call status')
      
      toast({
        title: "Success",
        description: `Call marked as ${status.toLowerCase()}`
      })
      
      fetchCalls()
    } catch (error) {
      console.error('Error updating call:', error)
      toast({
        title: "Error",
        description: "Failed to update call status",
        variant: "destructive"
      })
    }
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No scheduled calls
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => {
        const isLender = session?.user?.email === call.lender.email
        const otherParty = isLender ? call.buyer : call.lender
        
        return (
          <div key={call.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <p className="font-medium">
                    {new Date(call.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  With {otherParty.name} {isLender ? '' : `from ${call.lender.company}`}
                </p>
                {call.memo && (
                  <p className="mt-2 text-sm bg-gray-50 p-2 rounded-md">
                    {call.memo}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  call.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                  call.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {call.status}
                </span>
                {call.status === 'SCHEDULED' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCallStatus(call.id, 'COMPLETED')}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateCallStatus(call.id, 'CANCELLED')}
                      className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 