const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')
const express = require('express')
const http = require('http')

const app = express()
const server = http.createServer(app)
const prisma = new PrismaClient()

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join_chat', ({ requestId, userId }) => {
    socket.join(`chat_${requestId}`)
    console.log(`User ${userId} joined chat for request ${requestId}`)
  })

  socket.on('send_message', async (data) => {
    const { requestId, senderId, content } = data

    try {
      const message = await prisma.message.create({
        data: { requestId, senderId, content }
      })

      io.to(`chat_${requestId}`).emit('new_message', message)
    } catch (error) {
      console.error('Error saving message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.SOCKET_PORT || 3001
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
}) 