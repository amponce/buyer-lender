'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect, useRef } from 'react'
import { Message } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  currentUserType: 'buyer' | 'lender'
  otherUserId: string
  requestId: string
}

export default function ChatModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserType,
  otherUserId,
  requestId
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAITyping, setIsAITyping] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamedResponse])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(otherUserId)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }
        const data = await response.json()
        console.log('Fetched messages:', data)
        setMessages(data)
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    if (isOpen) {
      fetchMessages()
    }
  }, [isOpen, requestId, otherUserId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const userMessage = newMessage
    setNewMessage('')
    setIsAITyping(true)
    setStreamedResponse('')

    try {
      // Send user message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage,
          requestId,
          lenderId: otherUserId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }))
        throw new Error(errorData.error || 'Failed to send message')
      }

      const responseData = await response.json().catch(() => null)
      if (!responseData) {
        throw new Error('Invalid response data')
      }

      setMessages(prev => [...prev, responseData])

      // Only get AI response if the current user is a buyer
      if (currentUserType === 'buyer') {
        // Get AI response with streaming
        const aiResponse = await fetch('/api/messages/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage,
            requestId,
            senderId: currentUserId,
            lenderId: otherUserId
          }),
        })

        if (!aiResponse.ok) {
          const errorData = await aiResponse.text()
          throw new Error(errorData || 'Failed to get AI response')
        }

        const reader = aiResponse.body?.getReader()
        if (!reader) {
          throw new Error('No reader available for streaming response')
        }

        try {
          let accumulatedResponse = ''
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            accumulatedResponse += text
            setStreamedResponse(accumulatedResponse)
          }

          // Final decode to catch any remaining bytes
          const final = decoder.decode()
          if (final) {
            accumulatedResponse += final
            setStreamedResponse(accumulatedResponse)
          }

          // After streaming is complete, fetch the updated messages
          const aiMessageResponse = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(otherUserId)}`)
          if (!aiMessageResponse.ok) {
            throw new Error('Failed to fetch updated messages')
          }

          const updatedMessages = await aiMessageResponse.json()
          setMessages(updatedMessages)

        } catch (error) {
          console.error('Error in streaming:', error)
          throw error
        } finally {
          reader.releaseLock()
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      // Re-enable the input field on error
      setNewMessage(userMessage)
    } finally {
      setIsAITyping(false)
      setStreamedResponse('')
    }
  }

  const TypingIndicator = () => (
    <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  )

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded bg-white">
          <div className="flex flex-col h-[600px]">
            <div className="p-4 border-b">
              <Dialog.Title className="text-lg font-semibold">
                Chat with {currentUserType === 'buyer' ? 'Lender' : 'Buyer'}
              </Dialog.Title>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.senderId === currentUserId
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {streamedResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
                    <p className="whitespace-pre-wrap">{streamedResponse}</p>
                  </div>
                </div>
              )}

              {isAITyping && !streamedResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 