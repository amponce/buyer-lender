import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden - Lenders only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const aiProfile = await prisma.lenderAIProfile.findUnique({
      where: { lenderId: session.user.id }
    })

    return NextResponse.json(aiProfile)
  } catch (error) {
    console.error('Error in GET /api/lender/ai-profile:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (session.user.role !== 'LENDER') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden - Lenders only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['rateSheet', 'guidelines', 'productInfo', 'faqResponses']
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      return new NextResponse(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate JSON format for rateSheet
    try {
      JSON.parse(data.rateSheet)
    } catch (e) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate sheet must be valid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Update or create AI profile
    const aiProfile = await prisma.lenderAIProfile.upsert({
      where: { lenderId: session.user.id },
      update: {
        isAutopilotActive: data.isAutopilotActive,
        rateSheet: data.rateSheet,
        guidelines: data.guidelines,
        productInfo: data.productInfo,
        faqResponses: data.faqResponses
      },
      create: {
        lenderId: session.user.id,
        isAutopilotActive: data.isAutopilotActive,
        rateSheet: data.rateSheet,
        guidelines: data.guidelines,
        productInfo: data.productInfo,
        faqResponses: data.faqResponses
      }
    })

    return NextResponse.json(aiProfile)
  } catch (error) {
    console.error('Error in POST /api/lender/ai-profile:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 