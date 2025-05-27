import React, { useState, useEffect, useRef } from "react"

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  screenshots: Array<{ path: string; preview: string }>
}

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  screenshots
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioResult, setAudioResult] = useState<string | null>(null)
  const chunks = useRef<Blob[]>([])

  useEffect(() => {
    // Always report no tooltip for simplified version
    onTooltipVisibilityChange(false, 0)
  }, [])

  const handleRecordClick = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (e) => chunks.current.push(e.data)
        recorder.onstop = async () => {
          const blob = new Blob(chunks.current, { type: chunks.current[0]?.type || 'audio/webm' })
          chunks.current = []
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1]
            try {
              const result = await window.electronAPI.analyzeAudioFromBase64(base64Data, blob.type)
              setAudioResult(result.text)
            } catch (err) {
              setAudioResult('Audio analysis failed.')
            }
          }
          reader.readAsDataURL(blob)
        }
        setMediaRecorder(recorder)
        recorder.start()
        setIsRecording(true)
      } catch (err) {
        setAudioResult('Could not start recording.')
      }
    } else {
      // Stop recording
      mediaRecorder?.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  return (
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

        {/* Solve Command */}
        {screenshots.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">Ask AI</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">⌘</kbd>
              <kbd className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">↵</kbd>
            </div>
          </div>
        )}

        {/* Voice Recording Button */}
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          onClick={handleRecordClick}
          type="button"
        >
          {isRecording ? (
            <span className="animate-pulse">● Stop</span>
          ) : (
            <span>Record</span>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          className="text-red-500/70 hover:text-red-500/90 transition-colors text-xs px-2 py-1 rounded hover:bg-red-50"
          title="Quit App"
          onClick={() => window.electronAPI.quitApp()}
        >
          ✕
        </button>
      </div>
      
      {/* Audio Result Display */}
      {audioResult && (
        <div className="mt-2 p-2 bg-white/10 rounded text-white text-xs max-w-md">
          <span className="font-semibold">Audio Result:</span> {audioResult}
        </div>
      )}
    </div>
  )
}

export default QueueCommands 