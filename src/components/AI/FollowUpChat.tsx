import React, { useState, useRef, useEffect } from "react"

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FollowUpChatProps {
  initialContent: string
  onSendMessage: (message: string) => Promise<string>
  isLoading?: boolean
}

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  initialContent,
  onSendMessage,
  isLoading = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: initialContent,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    try {
      const response = await onSendMessage(inputValue.trim())
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-600 border-b border-gray-200 pb-2">
        Follow-up Questions
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="animate-pulse">Thinking...</div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-2">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a follow-up question..."
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          disabled={isSending || isLoading}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            Press Enter to send, Shift+Enter for new line
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || isLoading}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Quick action buttons for common follow-up questions
interface QuickActionsProps {
  onActionSelect: (action: string) => void
  contentType: string
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionSelect,
  contentType
}) => {
  const getQuickActions = () => {
    const baseActions = [
      { text: "Explain this differently", icon: "🔄" },
      { text: "Give me an example", icon: "💡" },
      { text: "What's the next step?", icon: "➡️" }
    ]

    const typeSpecificActions = {
      code: [
        { text: "Show me the output", icon: "📤" },
        { text: "Add error handling", icon: "🛡️" },
        { text: "Make it more efficient", icon: "⚡" }
      ],
      math: [
        { text: "Show the work", icon: "📝" },
        { text: "Check my answer", icon: "✅" },
        { text: "Explain the formula", icon: "🧮" }
      ],
      text: [
        { text: "Make it shorter", icon: "✂️" },
        { text: "Make it more formal", icon: "🎩" },
        { text: "Add more details", icon: "📋" }
      ]
    }

    return [
      ...baseActions,
      ...(typeSpecificActions[contentType as keyof typeof typeSpecificActions] || [])
    ]
  }

  const actions = getQuickActions()

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-600">Quick Actions</div>
      <div className="flex flex-wrap gap-1">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionSelect(action.text)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-1"
          >
            <span>{action.icon}</span>
            <span>{action.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 