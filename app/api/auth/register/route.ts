import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    })

    return NextResponse.json({ message: 'User created successfully' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 400 }
    )
  }
} 