import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: email as string,
        password: hashedPassword,
        role: role as string,
      },
    })

    return NextResponse.json({ message: 'User created successfully' })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 400 }
    )
  }
} 