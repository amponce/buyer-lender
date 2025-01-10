import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/users/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phoneNumber: true,
        profilePhoto: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        occupation: true,
        employer: true,
        company: true,
        licenseNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in GET /api/users/profile:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH /api/users/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()
    const allowedFields = [
      'name',
      'phoneNumber',
      'profilePhoto',
      'dateOfBirth',
      'address',
      'city',
      'state',
      'zipCode',
      'occupation',
      'employer'
    ]

    // For lenders, allow additional fields
    if (session.user.role === 'LENDER') {
      allowedFields.push('company', 'licenseNumber', 'bio')
    }

    // Filter out any fields that aren't allowed
    const updateData = Object.keys(data).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = data[key]
      }
      return acc
    }, {} as Record<string, any>)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phoneNumber: true,
        profilePhoto: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        occupation: true,
        employer: true,
        company: true,
        licenseNumber: true,
        bio: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in PATCH /api/users/profile:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 