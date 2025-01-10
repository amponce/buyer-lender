import { Socket } from 'socket.io-client'
import io from 'socket.io-client'
import type { Message, QuoteRequest } from '@/types'

// Type guard for QuoteRequest
const isQuoteRequest = (data: any): data is QuoteRequest => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.buyerId === 'string' &&
    typeof data.creditScore === 'number' &&
    typeof data.annualIncome === 'number' &&
    typeof data.purchasePrice === 'number' &&
    typeof data.propertyState === 'string' &&
    Array.isArray(data.quotes) &&
    Array.isArray(data.aiConversations)
  )
}

let socket: ReturnType<typeof io> | null = null

export const initializeSocket = (): ReturnType<typeof io> | null => {
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

export const getSocket = (): ReturnType<typeof io> | null => {
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
  socket.on('quote_request_received', (data: any) => {
    if (isQuoteRequest(data)) {
      callback(data)
    } else {
      console.error('Received invalid quote request data:', data)
    }
  })
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
