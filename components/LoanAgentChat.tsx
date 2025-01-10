'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'agent' | 'buyer' | 'lender'
  content: string
  timestamp: Date
}

interface Props {
  lenderId: string
  quoteLoanAmount?: number
  quoteInterestRate?: number
  lenderName?: string
  quoteDetails?: {
    loanTerm: number
    monthlyPayment: number
    propertyValue?: number
    downPayment?: number
    pmi?: number
    estimatedTaxes?: number
    estimatedInsurance?: number
  }
  onSendToLender?: (message: string) => Promise<void>
  onScheduleCall?: (time: Date) => Promise<void>
}

export default function LoanAgentChat({
  lenderId,
  quoteLoanAmount,
  quoteInterestRate,
  lenderName,
  quoteDetails,
  onSendToLender,
  onScheduleCall
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Loan context for AI to reference
  const loanContext = {
    loanAmount: quoteLoanAmount || 0,
    interestRate: quoteInterestRate || 0,
    term: quoteDetails?.loanTerm || 30,
    monthlyPayment: quoteDetails?.monthlyPayment || 0,
    propertyValue: quoteDetails?.propertyValue || 0,
    downPayment: quoteDetails?.downPayment || 0,
    pmi: quoteDetails?.pmi || 0,
    taxes: quoteDetails?.estimatedTaxes || 0,
    insurance: quoteDetails?.estimatedInsurance || 0,
    totalMonthly: (quoteDetails?.monthlyPayment || 0) + 
                  (quoteDetails?.pmi || 0) + 
                  (quoteDetails?.estimatedTaxes || 0) + 
                  (quoteDetails?.estimatedInsurance || 0)
  }

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message on mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'agent',
      content: `Hi! I'm here to help you understand your loan options. I see you're looking at a $${loanContext.propertyValue.toLocaleString()} property with:

• ${loanContext.term}-year fixed rate at ${loanContext.interestRate.toFixed(3)}%
• $${loanContext.downPayment.toLocaleString()} down payment (${(loanContext.downPayment / loanContext.propertyValue * 100).toFixed(1)}%)
• $${Math.round(loanContext.totalMonthly).toLocaleString()} total monthly payment

What would you like to know more about?`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Check if user is asking about monthly payment
    if (lowerMessage.includes('monthly') || lowerMessage.includes('payment')) {
      return `Your monthly payment of $${Math.round(loanContext.totalMonthly).toLocaleString()} breaks down as:

• $${Math.round(loanContext.monthlyPayment).toLocaleString()} for principal and interest
• $${Math.round(loanContext.taxes).toLocaleString()} for property taxes
• $${Math.round(loanContext.insurance).toLocaleString()} for homeowner's insurance
${loanContext.pmi > 0 ? `• $${Math.round(loanContext.pmi).toLocaleString()} for mortgage insurance` : ''}

Would you like to explore options to lower your payment?`
    }

    // Check if user is asking about interest rate
    if (lowerMessage.includes('rate') || lowerMessage.includes('interest')) {
      return `Your interest rate is ${loanContext.interestRate.toFixed(3)}%. Based on today's market, this is ${loanContext.interestRate > 6.5 ? 'a bit high' : 'quite competitive'}.

Would you like to:
• See how different rates would affect your payment?
• Learn about buying points to lower your rate?
• Compare with other loan types?`
    }

    // Check if user is asking about down payment
    if (lowerMessage.includes('down') || lowerMessage.includes('put down')) {
      const downPaymentPercent = (loanContext.downPayment / loanContext.propertyValue) * 100
      return `You're putting down $${loanContext.downPayment.toLocaleString()} (${downPaymentPercent.toFixed(1)}% of the purchase price).

${downPaymentPercent >= 20 
  ? "That's great! Since you're putting down 20%, you won't need to pay mortgage insurance." 
  : `If you could increase this to 20% ($${Math.round(loanContext.propertyValue * 0.2).toLocaleString()}), you would eliminate the mortgage insurance payment of $${Math.round(loanContext.pmi).toLocaleString()}/month.`}

Would you like to see how different down payment amounts would affect your monthly payment?`
    }

    // Default response
    return `I can help you understand any aspect of your loan:

• Monthly payment breakdown
• Interest rate options
• Down payment scenarios
• Other loan types

What would you like to explore?`
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'buyer',
      content: inputValue,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI thinking and response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: generateResponse(inputValue),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Loan Assistant</h3>
        <p className="text-sm text-gray-500">Ask me anything about your loan options</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'buyer' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'buyer'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg w-16">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

