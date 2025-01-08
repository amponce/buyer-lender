import { Socket } from 'socket.io-client'
import io from 'socket.io-client'

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
}

interface QuoteRequest {
  id: string
  userId: string
  creditScore: number
  annualIncome: number
  purchasePrice: number
  propertyState: string
  status: string
}

let socket: typeof Socket | null = null

export const initializeSocket = (): typeof Socket | null => {
  if (typeof window === 'undefined') return null

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    socket = io(socketUrl)

    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })
  }

  return socket
}

export const getSocket = (): typeof Socket | null => {
  return socket
}

export const joinChat = (requestId: string, userId: string): void => {
  if (!socket) return
  socket.emit('join_chat', { requestId, userId })
}

export const sendMessage = (requestId: string, senderId: string, content: string): void => {
  if (!socket) return
  socket.emit('send_message', { requestId, senderId, content })
}

export const onNewMessage = (callback: (message: Message) => void): void => {
  if (!socket) return
  socket.on('new_message', callback)
}

export const onNewQuoteRequest = (callback: (quoteRequest: QuoteRequest) => void): void => {
  if (!socket) return
  socket.on('quote_request_received', callback)
}

export const onStatusUpdate = (callback: (data: { requestId: string, status: string }) => void): void => {
  if (!socket) return
  socket.on('status_update', callback)
}

export const cleanup = (): void => {
  if (!socket) return
  socket.disconnect()
  socket = null
}
