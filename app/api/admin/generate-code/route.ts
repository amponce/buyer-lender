import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()
    const code = crypto.randomBytes(6).toString('hex').toUpperCase()

    // Store the code in the database or environment variables
    // This is just an example - you'll want to implement proper code storage
    
    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error generating registration code:', error)
    return NextResponse.json(
      { error: 'Error generating registration code' },
      { status: 500 }
    )
  }
} 