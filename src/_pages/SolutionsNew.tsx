// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { ElectronAPI } from "../types/electron"

import ScreenshotQueue from "../components/Queue/ScreenshotQueueNew"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import { ProblemStatementData } from "../types/solutions"
import { AudioResult } from "../types/audio"
import SolutionCommands from "../components/Solutions/SolutionCommandsNew"
import Debug from "./DebugNew"
import { FollowUpChat, QuickActions, ChatMessage } from "../components/AI/FollowUpChat"

// (Using global ElectronAPI type from src/types/electron.d.ts)

export const ContentSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs text-gray-500 animate-pulse">
          Loading...
        </p>
      </div>
    ) : (
      <div className="text-sm leading-relaxed text-gray-700 max-w-full">
        {content}
      </div>
    )}
  </div>
)

const SolutionSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="space-y-1.5">
        <div className="mt-4 flex">
          <p className="text-xs text-gray-500 animate-pulse">
            Generating solution...
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full">
        <SyntaxHighlighter
          showLineNumbers
          language="python"
          style={oneLight}
          customStyle={{
            maxWidth: "100%",
            margin: 0,
            padding: "1rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            fontSize: "13px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
          wrapLongLines={true}
        >
          {content as string}
        </SyntaxHighlighter>
      </div>
    )}
  </div>
)

export const ComplexitySection = ({
  timeComplexity,
  spaceComplexity,
  isLoading
}: {
  timeComplexity: string | null
  spaceComplexity: string | null
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
      Complexity
    </h2>
    {isLoading ? (
      <p className="text-xs text-gray-500 animate-pulse">
        Calculating complexity...
      </p>
    ) : (
      <div className="space-y-1">
        <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
          <div>
            <strong>Time:</strong> {timeComplexity}
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
          <div>
            <strong>Space:</strong> {spaceComplexity}
          </div>
        </div>
      </div>
    )}
  </div>
)

interface SolutionsProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
}
const Solutions: React.FC<SolutionsProps> = ({ setView }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  // Audio recording state
  const [audioRecording, setAudioRecording] = useState(false)
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemStatementData, setProblemStatementData] =
    useState<ProblemStatementData | null>(null)
  const [solutionData, setSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )
  const [customContent, setCustomContent] = useState<string | null>(null)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const [isResetting, setIsResetting] = useState(false)

  // Enhanced AI features state
  const [showFollowUpChat, setShowFollowUpChat] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false)

  const { data: extraScreenshots = [], refetch } = useQuery<Array<{ path: string; preview: string }>, Error>(
    ["extras"],
    async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("Error loading extra screenshots:", error)
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity
    }
  )

  const showToast = (
    title: string,
    description: string,
    variant: ToastVariant
  ) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch() // Refetch screenshots instead of managing state directly
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot file", "error")
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
    }
  }

  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your screenshots.",
          "error"
        )
        setView("queue")
        console.error("Processing error:", error)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no extra screenshots to process.",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemStatementData(
          queryClient.getQueryData(["problem_statement"]) || null
        )
        // If this is from audio processing, show it in the custom content section
        const audioResult = queryClient.getQueryData(["audio_result"]) as AudioResult | undefined;
        if (audioResult) {
          // Update all relevant sections when audio result is received
          setProblemStatementData({
            problem_statement: audioResult.text,
            input_format: {
              description: "Generated from audio input",
              parameters: []
            },
            output_format: {
              description: "Generated from audio input",
              type: "string",
              subtype: "text"
            },
            complexity: {
              time: "N/A",
              space: "N/A"
            },
            test_cases: [],
            validation_type: "manual",
            difficulty: "custom"
          });
          setSolutionData(null); // Reset solution to trigger loading state
          setThoughtsData(null);
          setTimeComplexityData(null);
          setSpaceComplexityData(null);
        }
      }
      if (event?.query.queryKey[0] === "solution") {
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null

        setSolutionData(solution?.code ?? null)
        setThoughtsData(solution?.thoughts ?? null)
        setTimeComplexityData(solution?.time_complexity ?? null)
        setSpaceComplexityData(solution?.space_complexity ?? null)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  // Enhanced AI features functions

  const handleFollowUpMessage = async (message: string): Promise<string> => {
    try {
      const originalContent = customContent || problemStatementData?.problem_statement || ''
      const response = await window.electronAPI.askFollowUpQuestion(originalContent, message, conversationHistory)
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ])
      
      return response
    } catch (error) {
      console.error('Error in follow-up message:', error)
      throw new Error('Failed to get response')
    }
  }

  const handleQuickAction = async (action: string) => {
    try {
      setIsAnalyzingContent(true)
      const originalContent = customContent || problemStatementData?.problem_statement || ''
      
      const response = await window.electronAPI.askFollowUpQuestion(originalContent, action, conversationHistory)
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: action },
        { role: 'assistant', content: response }
      ])
      
      // Show the follow-up chat
      setShowFollowUpChat(true)
    } catch (error) {
      console.error('Error handling quick action:', error)
      showToast('Error', 'Failed to process your request', 'error')
    } finally {
      setIsAnalyzingContent(false)
    }
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <>
          <Debug
            isProcessing={debugProcessing}
            setIsProcessing={setDebugProcessing}
          />
        </>
      ) : (
        <div ref={contentRef} className="relative space-y-3 px-4 py-3">
          <Toast
            open={toastOpen}
            onOpenChange={setToastOpen}
            variant={toastMessage.variant}
            duration={3000}
          >
            <ToastTitle>{toastMessage.title}</ToastTitle>
            <ToastDescription>{toastMessage.description}</ToastDescription>
          </Toast>

          {/* Conditionally render the screenshot queue if solutionData is available */}
          {solutionData && (
            <div className="bg-transparent w-fit">
              <div className="pb-3">
                <div className="space-y-3 w-fit">
                  <ScreenshotQueue
                    isLoading={debugProcessing}
                    screenshots={extraScreenshots}
                    onDeleteScreenshot={handleDeleteExtraScreenshot}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navbar of commands with the SolutionsHelper */}
          <SolutionCommands
            extraScreenshots={extraScreenshots}
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
          />

          {/* Main Content - Clean white styling */}
          <div className="w-full">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
              <div className="px-4 py-4 space-y-4 max-w-full">
                {/* Show Screenshot or Audio Result as main output if validation_type is manual */}
                {problemStatementData?.validation_type === "manual" ? (
                  <ContentSection
                    title={problemStatementData?.output_format?.subtype === "voice" ? "Audio Result" : "Screenshot Result"}
                    content={problemStatementData.problem_statement}
                    isLoading={false}
                  />
                ) : (
                  <>
                    {/* Problem Statement Section - Only for non-manual */}
                    <ContentSection
                      title={problemStatementData?.output_format?.subtype === "voice" ? "Voice Input" : "Problem Statement"}
                      content={problemStatementData?.problem_statement}
                      isLoading={!problemStatementData}
                    />
                    {/* Show loading state when waiting for solution */}
                    {problemStatementData && !solutionData && (
                      <div className="mt-4 flex">
                        <p className="text-xs text-gray-500 animate-pulse">
                          {problemStatementData?.output_format?.subtype === "voice" 
                            ? "Processing voice input..." 
                            : "Generating solutions..."}
                        </p>
                      </div>
                    )}
                    {/* Solution Sections (legacy, only for non-manual) */}
                    {solutionData && (
                      <>
                        <ContentSection
                          title="Analysis"
                          content={
                            thoughtsData && (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  {thoughtsData.map((thought, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-2"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                      <div>{thought}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          isLoading={!thoughtsData}
                        />
                        <SolutionSection
                          title={problemStatementData?.output_format?.subtype === "voice" ? "Response" : "Solution"}
                          content={solutionData}
                          isLoading={!solutionData}
                        />
                        {problemStatementData?.output_format?.subtype !== "voice" && (
                          <ComplexitySection
                            timeComplexity={timeComplexityData}
                            spaceComplexity={spaceComplexityData}
                            isLoading={!timeComplexityData || !spaceComplexityData}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Enhanced AI Features */}
                {(problemStatementData || customContent) && (
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    {/* Toggle button for AI features */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowFollowUpChat(!showFollowUpChat)
                        }}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded border border-green-200 hover:border-green-300 transition-colors flex items-center gap-1"
                      >
                        <span>💬</span>
                        <span>Ask Follow-up</span>
                      </button>
                    </div>

                    {/* Follow-up Chat Section */}
                    {showFollowUpChat && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <FollowUpChat
                          initialContent={customContent || problemStatementData?.problem_statement || ''}
                          onSendMessage={handleFollowUpMessage}
                          isLoading={isAnalyzingContent}
                        />
                      </div>
                    )}

                    {/* Quick Actions */}
                    {!showFollowUpChat && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <QuickActions
                          onActionSelect={handleQuickAction}
                          contentType="general"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Solutions 