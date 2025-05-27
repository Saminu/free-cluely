import React, { useState, useEffect, useRef } from "react"

interface SolutionCommandsProps {
  extraScreenshots: any[]
  onTooltipVisibilityChange?: (visible: boolean, height: number) => void
}

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  extraScreenshots,
  onTooltipVisibilityChange
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onTooltipVisibilityChange) {
      // Always report no tooltip for simplified version
      onTooltipVisibilityChange(false, 0)
    }
  }, [onTooltipVisibilityChange])

  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg py-2 px-3 flex items-center justify-center gap-3">
          {/* Show/Hide */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Show/Hide</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">⌘</kbd>
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">B</kbd>
            </div>
          </div>

          {/* Screenshot */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Screenshot</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">⌘</kbd>
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">H</kbd>
            </div>
          </div>

          {/* Debug Command */}
          {extraScreenshots.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Debug</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">⌘</kbd>
                <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">↵</kbd>
              </div>
            </div>
          )}

          {/* Start Over */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Reset</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">⌘</kbd>
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">R</kbd>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            className="text-red-500/70 hover:text-red-500/90 transition-colors text-xs px-2 py-1 rounded hover:bg-red-50"
            title="Quit App"
            onClick={() => window.electronAPI.quitApp()}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default SolutionCommands 