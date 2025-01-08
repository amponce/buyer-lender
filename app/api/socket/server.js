const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const io = new Server({
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
      // Save message to database
      const message = await prisma.message.create({
        data: {
          requestId,
          senderId,
          content
        }
      })

      // Broadcast to all users in the chat room
      io.to(`chat_${requestId}`).emit('new_message', message)
    } catch (error) {
      console.error('Error saving message:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  socket.on('new_quote_request', (quoteRequest) => {
    // Broadcast to all connected lenders
    socket.broadcast.emit('quote_request_received', quoteRequest)
  })

  socket.on('quote_status_updated', ({ requestId, status }) => {
    // Broadcast status update to all users in the chat room
    io.to(`chat_${requestId}`).emit('status_update', { requestId, status })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = parseInt(process.env.SOCKET_PORT || '3001')
io.listen(PORT)

console.log(`WebSocket server running on port ${PORT}`) 