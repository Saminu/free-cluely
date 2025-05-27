import React, { useState, useEffect } from 'react'
import { Mic, MicOff, MessageSquare, Eye, EyeOff, Settings, Camera } from 'lucide-react'

interface HeaderBarProps {
  isRecording: boolean
  onToggleRecording: () => void
  onAskAI: () => void
  onToggleVisibility: () => void
  onTakeScreenshot?: () => void
  recordingTime: number
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  isRecording,
  onToggleRecording,
  onAskAI,
  onToggleVisibility,
  onTakeScreenshot,
  recordingTime
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-3 flex items-center justify-between min-w-[600px]">
      {/* Recording Section */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleRecording}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          <span className="text-sm font-medium">
            {formatTime(recordingTime)}
          </span>
        </button>
      </div>

      {/* Center Actions */}
      <div className="flex items-center space-x-2">
        {onTakeScreenshot && (
          <button
            onClick={onTakeScreenshot}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Camera size={16} />
            <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-green-400 rounded">⌘H</kbd>
          </button>
        )}

        <button
          onClick={onAskAI}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MessageSquare size={16} />
          <span className="text-sm font-medium">Ask AI</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-blue-400 rounded">⌘</kbd>
        </button>

        <button
          onClick={onToggleVisibility}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Eye size={16} />
          <span className="text-sm font-medium">Show/Hide</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded">⌘B</kbd>
        </button>
      </div>

      {/* Settings */}
      <div className="flex items-center">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}

export default HeaderBar 