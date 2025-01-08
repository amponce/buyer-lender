import { Server } from 'socket.io'
import { createServer } from 'http'
import express from 'express'
import { PrismaClient } from '@prisma/client'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const prisma = new PrismaClient()

io.on('connection', (socket) => {
  socket.on('join_chat', async ({ requestId, userId }) => {
    socket.join(`chat_${requestId}`)
    
    // Send message history
    const messages = await prisma.message.findMany({
      where: { requestId: parseInt(requestId) },
      orderBy: { createdAt: 'asc' },
    })
    
    socket.emit('message_history', messages)
  })

  socket.on('send_message', async (data) => {
    const message = await prisma.message.create({
      data: {
        requestId: parseInt(data.requestId),
        senderId: data.senderId,
        content: data.content,
      },
    })

    io.to(`chat_${data.requestId}`).emit('new_message', message)
  })
})

const PORT = process.env.SOCKET_PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
}) 