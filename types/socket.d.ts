declare module '@/lib/socket' {
  import { Socket } from 'socket.io-client'
  import type { Message, QuoteRequest } from '@/types'

  export function initializeSocket(): Socket | null
  export function getSocket(): Socket | null
  export function joinChat(requestId: string, userId: string): void
  export function sendMessage(requestId: string, senderId: string, content: string): void
  export function onNewMessage(callback: (message: Message) => void): void
  export function onNewQuoteRequest(callback: (quoteRequest: QuoteRequest) => void): void
  export function onStatusUpdate(callback: (data: { requestId: string, status: string }) => void): void
  export function cleanup(): void
} 