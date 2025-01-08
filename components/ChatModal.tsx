'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@headlessui/react'

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
  createdAt: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch message history
  useEffect(() => {
    if (!isOpen || !requestId) return

    const fetchMessages = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(otherUserId)}`)
        if (!response.ok) {
          const text = await response.text()
          let errorMessage = 'Failed to fetch messages'
          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = text || errorMessage
          }
          setError(errorMessage)
          return
        }
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
        setError('Failed to load messages. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [isOpen, requestId, otherUserId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !requestId) return

    setSendError(null)
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(otherUserId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Failed to send message'
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        setSendError(errorMessage)
        return
      }

      const sentMessage = await response.json()
      setMessages(prev => [...prev, sentMessage])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setSendError('Failed to send message. Please try again.')
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 bg-black opacity-30" />

        <div className="relative mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium">
              Chat with {currentUserType === 'buyer' ? 'Lender' : 'Buyer'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close chat"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-red-500">{error}</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-gray-500">No messages yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUserId
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.senderId === currentUserId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="mt-1 text-xs opacity-75">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="mt-4">
            {sendError && (
              <div className="mb-2 text-sm text-red-500">{sendError}</div>
            )}
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
} 