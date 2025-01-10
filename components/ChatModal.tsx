'use client'

import { Dialog } from '@headlessui/react'
import { useState, useEffect, useRef } from 'react'
import { Message } from '@/types'

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserType: 'buyer' | 'lender';
  otherUserId: string;
  requestId: string;
  lenderId: string;
}

export default function ChatModal({
  isOpen,
  onClose,
  currentUserId,
  currentUserType,
  otherUserId,
  requestId,
  lenderId
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAITyping, setIsAITyping] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [draftConversation, setDraftConversation] = useState<{ role: string; content: string }[]>([])
  const [isDraftMode, setIsDraftMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamedResponse, draftConversation])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(lenderId)}`)
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
  }, [isOpen, requestId, lenderId])

  const getAIPreview = async () => {
    if (!newMessage.trim()) return

    setIsAITyping(true)
    setStreamedResponse('')

    try {
      const aiResponse = await fetch('/api/messages/ai/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          requestId,
          lenderId,
          senderId: currentUserId
        }),
      })

      if (!aiResponse.ok) {
        const errorData = await aiResponse.text()
        throw new Error(errorData || 'Failed to get AI preview')
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

          const text = decoder.decode(value)
          accumulatedResponse += text
          setStreamedResponse(accumulatedResponse)
        }

        setShowPreview(true)
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error getting AI preview:', error)
    } finally {
      setIsAITyping(false)
    }
  }

  const continueAIConversation = async () => {
    if (!newMessage.trim()) return

    setIsAITyping(true)
    setStreamedResponse('')

    try {
      const aiResponse = await fetch('/api/messages/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          requestId,
          lenderId,
          conversation: draftConversation
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

          const text = decoder.decode(value)
          accumulatedResponse += text
          setStreamedResponse(accumulatedResponse)
        }

        // Add the messages to the draft conversation
        setDraftConversation(prev => [
          ...prev,
          { role: 'user', content: newMessage },
          { role: 'assistant', content: accumulatedResponse }
        ])
        setNewMessage('')
        setStreamedResponse('')
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Error in AI conversation:', error)
    } finally {
      setIsAITyping(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentUserType === 'lender') {
      if (isDraftMode && !showPreview) {
        continueAIConversation()
        return
      } else if (!isDraftMode && !showPreview) {
        getAIPreview()
        return
      }
    }

    if (!newMessage.trim() || !streamedResponse) return

    try {
      // Send both the original lender message and AI's processed message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          requestId,
          lenderId,
          isOriginalMessage: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send original message')
      }

      const aiMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: streamedResponse,
          requestId,
          lenderId,
          isAIProcessed: true
        }),
      })

      if (!aiMessageResponse.ok) {
        throw new Error('Failed to send AI processed message')
      }

      // Fetch updated messages to show both original and processed versions
      const updatedMessagesResponse = await fetch(`/api/messages/${encodeURIComponent(requestId)}?lenderId=${encodeURIComponent(lenderId)}`)
      if (!updatedMessagesResponse.ok) {
        throw new Error('Failed to fetch updated messages')
      }

      const updatedMessages = await updatedMessagesResponse.json()
      setMessages(updatedMessages)
      setNewMessage('')
      setStreamedResponse('')
      setShowPreview(false)
      setDraftConversation([])
      setIsDraftMode(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleCancel = () => {
    setNewMessage('')
    setStreamedResponse('')
    setShowPreview(false)
    setDraftConversation([])
    setIsDraftMode(false)
  }

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
              {currentUserType === 'lender' && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-gray-500">
                    Your messages will be processed by AI for clarity before being sent to the buyer
                  </p>
                  {!isDraftMode && !showPreview && (
                    <button
                      onClick={() => setIsDraftMode(true)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Want to discuss with AI first? Click here
                    </button>
                  )}
                </div>
              )}
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
                        ? message.isAIProcessed
                          ? 'bg-green-600 text-white'
                          : 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.isAIProcessed && (
                      <div className="text-xs text-white/80 mb-1">AI Processed Message:</div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isDraftMode && draftConversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-green-50 text-gray-900'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}:
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {streamedResponse && !isDraftMode && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-3 bg-primary-600 text-white">
                      <div className="text-xs text-white/80 mb-1">Your Original Message:</div>
                      <p className="whitespace-pre-wrap">{newMessage}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-3 bg-green-600 text-white">
                      <div className="text-xs text-white/80 mb-1">AI Preview:</div>
                      <p className="whitespace-pre-wrap">{streamedResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {isAITyping && !streamedResponse && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-green-50 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    </div>
                    <div className="text-xs text-green-600 mt-1">AI is processing your message...</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={currentUserType === 'lender' 
                      ? isDraftMode
                        ? "Chat with AI..."
                        : "Type your message and click Preview..."
                      : "Type your message..."}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newMessage.trim() || (currentUserType === 'lender' && !isDraftMode && !showPreview)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {currentUserType === 'lender'
                      ? isDraftMode
                        ? 'Continue'
                        : !showPreview
                          ? 'Preview'
                          : 'Send'
                      : 'Send'}
                  </button>
                </div>
                {isDraftMode && draftConversation.length > 0 && (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Get the last message from AI as the preview
                        const lastAIMessage = draftConversation.findLast(msg => msg.role === 'assistant')
                        if (lastAIMessage) {
                          setStreamedResponse(lastAIMessage.content)
                          setShowPreview(true)
                          setIsDraftMode(false)
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Use This Version
                    </button>
                  </div>
                )}
                {showPreview && !isDraftMode && (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Send AI Processed Message
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 