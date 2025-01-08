'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { io, Socket } from 'socket.io-client'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  currentUserType: 'buyer' | 'lender'
  otherUserId: string
  requestId: string
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
}

export default function ChatModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserType,
  otherUserId,
  requestId,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
    setSocket(newSocket)

    newSocket.emit('join_chat', { requestId, userId: currentUserId })

    newSocket.on('message_history', (history: Message[]) => {
      setMessages(history)
    })

    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      newSocket.disconnect()
    }
  }, [requestId, currentUserId])

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return

    socket.emit('send_message', {
      requestId,
      senderId: currentUserId,
      content: newMessage,
      timestamp: new Date(),
    })

    setNewMessage('')
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Chat with {currentUserType === 'buyer' ? 'Lender' : 'Buyer'}
          </Dialog.Title>

          <div className="h-96 overflow-y-auto mb-4 p-4 border rounded">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-2 ${
                  message.senderId === currentUserId
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 p-2 border rounded"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Send
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 