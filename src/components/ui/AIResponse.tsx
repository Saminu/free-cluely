import React from 'react'
import { Bot, Clock, Copy, ThumbsUp, ThumbsDown } from 'lucide-react'

interface AIResponseProps {
  response: string
  context?: string
  timestamp?: number
  isLoading?: boolean
}

const AIResponse: React.FC<AIResponseProps> = ({
  response,
  context,
  timestamp,
  isLoading = false
}) => {
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response)
  }

  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 max-w-2xl">
        <div className="flex items-center space-x-2 mb-3">
          <Bot className="text-blue-500 animate-pulse" size={20} />
          <span className="font-semibold text-gray-800">AI Response</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Bot className="text-blue-500" size={20} />
          <span className="font-semibold text-gray-800">AI Response</span>
        </div>
        {timestamp && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>{formatTimestamp(timestamp)}</span>
          </div>
        )}
      </div>

      {/* Context */}
      {context && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-800 italic">{context}</p>
        </div>
      )}

      {/* Response */}
      <div className="prose prose-sm max-w-none">
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {response}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <Copy size={12} />
            <span>Copy</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button className="p-1 text-gray-400 hover:text-green-500 transition-colors">
            <ThumbsUp size={14} />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIResponse 