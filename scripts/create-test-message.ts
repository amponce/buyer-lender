import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function createTestMessage() {
  try {
    const message = await prisma.message.create({
      data: {
        requestId: '16d2fb12-c341-4d70-bf44-892e7bcfcfd0',
        senderId: '89043356-eae0-435e-b6a7-4fb78a9c4d11',
        lenderId: 'b7fb8ba7-6f8c-40f9-9b6c-07e10ca74b0f',
        content: 'Test message from buyer'
      }
    })
    console.log('Created message:', message)
  } catch (e) {
    console.error('Error creating message:', e)
  } finally {
    await prisma.$disconnect()
  }
}

createTestMessage() 