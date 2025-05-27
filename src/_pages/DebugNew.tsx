// Debug.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ComplexitySection, ContentSection } from "./SolutionsNew"
import ScreenshotQueue from "../components/Queue/ScreenshotQueueNew"
import {
  Toast,
  ToastDescription,
  ToastMessage,
  ToastTitle,
  ToastVariant
} from "../components/ui/toast"
import ExtraScreenshotsQueueHelper from "../components/Solutions/SolutionCommandsNew"
import { diffLines } from "diff"

type DiffLine = {
  value: string
  added?: boolean
  removed?: boolean
}

const syntaxHighlighterStyles = {
  ".syntax-line": {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word"
  }
} as const

const CodeComparisonSection = ({
  oldCode,
  newCode,
  isLoading
}: {
  oldCode: string | null
  newCode: string | null
  isLoading: boolean
}) => {
  const computeDiff = () => {
    if (!oldCode || !newCode) return { leftLines: [], rightLines: [] }

    // Normalize line endings and clean up the code
    const normalizeCode = (code: string) => {
      return code
        .replace(/\r\n/g, "\n") // Convert Windows line endings to Unix
        .replace(/\r/g, "\n") // Convert remaining carriage returns
        .trim() // Remove leading/trailing whitespace
    }

    const normalizedOldCode = normalizeCode(oldCode)
    const normalizedNewCode = normalizeCode(newCode)

    // Generate the diff
    const diff = diffLines(normalizedOldCode, normalizedNewCode, {
      newlineIsToken: true,
      ignoreWhitespace: true // Changed to true to better handle whitespace differences
    })

    // Process the diff to create parallel arrays
    const leftLines: DiffLine[] = []
    const rightLines: DiffLine[] = []

    diff.forEach((part) => {
      if (part.added) {
        // Add empty lines to left side
        leftLines.push(...Array(part.count || 0).fill({ value: "" }))
        // Add new lines to right side, filter out empty lines at the end
        rightLines.push(
          ...part.value
            .split("\n")
            .filter((line) => line.length > 0)
            .map((line) => ({
              value: line,
              added: true
            }))
        )
      } else if (part.removed) {
        // Add removed lines to left side, filter out empty lines at the end
        leftLines.push(
          ...part.value
            .split("\n")
            .filter((line) => line.length > 0)
            .map((line) => ({
              value: line,
              removed: true
            }))
        )
        // Add empty lines to right side
        rightLines.push(...Array(part.count || 0).fill({ value: "" }))
      } else {
        // Add unchanged lines to both sides
        const lines = part.value.split("\n").filter((line) => line.length > 0)
        leftLines.push(...lines.map((line) => ({ value: line })))
        rightLines.push(...lines.map((line) => ({ value: line })))
      }
    })

    return { leftLines, rightLines }
  }

  const { leftLines, rightLines } = computeDiff()

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
        Code Comparison
      </h2>
      {isLoading ? (
        <div className="space-y-1">
          <div className="mt-3 flex">
            <p className="text-xs text-gray-500 animate-pulse">
              Loading code comparison...
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {/* Previous Code */}
          <div className="w-1/2 border-r border-gray-200">
            <div className="bg-gray-100 px-3 py-2">
              <h3 className="text-xs font-medium text-gray-700">
                Previous Version
              </h3>
            </div>
            <div className="p-3 overflow-x-auto">
              <SyntaxHighlighter
                language="python"
                style={oneLight}
                customStyle={{
                  maxWidth: "100%",
                  margin: 0,
                  padding: "1rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontSize: "13px",
                  borderRadius: "6px",
                  backgroundColor: "#fafafa"
                }}
                wrapLines={true}
                showLineNumbers={true}
                lineProps={(lineNumber) => {
                  const line = leftLines[lineNumber - 1]
                  return {
                    style: {
                      display: "block",
                      backgroundColor: line?.removed
                        ? "rgba(239, 68, 68, 0.1)"
                        : "transparent"
                    }
                  }
                }}
              >
                {leftLines.map((line) => line.value).join("\n")}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* New Code */}
          <div className="w-1/2">
            <div className="bg-gray-100 px-3 py-2">
              <h3 className="text-xs font-medium text-gray-700">
                New Version
              </h3>
            </div>
            <div className="p-3 overflow-x-auto">
              <SyntaxHighlighter
                language="python"
                style={oneLight}
                customStyle={{
                  maxWidth: "100%",
                  margin: 0,
                  padding: "1rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  fontSize: "13px",
                  borderRadius: "6px",
                  backgroundColor: "#fafafa"
                }}
                wrapLines={true}
                showLineNumbers={true}
                lineProps={(lineNumber) => {
                  const line = rightLines[lineNumber - 1]
                  return {
                    style: {
                      display: "block",
                      backgroundColor: line?.added
                        ? "rgba(34, 197, 94, 0.1)"
                        : "transparent"
                    }
                  }
                }}
              >
                {rightLines.map((line) => line.value).join("\n")}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DebugProps {
  isProcessing: boolean
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>
}

const Debug: React.FC<DebugProps> = ({ isProcessing, setIsProcessing }) => {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)

  const [problemStatementData, setProblemStatementData] = useState<any>(null)
  const [oldSolutionData, setOldSolutionData] = useState<string | null>(null)
  const [newSolutionData, setNewSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

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
        refetch()
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
      window.electronAPI.onResetView(() => refetch())
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    const solutionData = queryClient.getQueryData(["solution"]) as { code: string } | null
    setOldSolutionData(solutionData?.code || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemStatementData(
          queryClient.getQueryData(["problem_statement"]) || null
        )
      }
      if (event?.query.queryKey[0] === "solution") {
        const solutionData = queryClient.getQueryData(["solution"]) as { code: string } | null
        setOldSolutionData(solutionData?.code || null)
      }
      if (event?.query.queryKey[0] === "new_solution") {
        const newSolution = queryClient.getQueryData(["new_solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null

        setNewSolutionData(newSolution?.code ?? null)
        setThoughtsData(newSolution?.thoughts ?? null)
        setTimeComplexityData(newSolution?.time_complexity ?? null)
        setSpaceComplexityData(newSolution?.space_complexity ?? null)
        setIsProcessing(false)
      }
    })
    return () => unsubscribe()
  }, [queryClient, setIsProcessing])

  return (
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

      <div className="bg-transparent w-fit">
        <div className="pb-3">
          <div className="space-y-3 w-fit">
            <ScreenshotQueue
              isLoading={isProcessing}
              screenshots={extraScreenshots}
              onDeleteScreenshot={handleDeleteExtraScreenshot}
            />
          </div>
        </div>
      </div>

      <ExtraScreenshotsQueueHelper
        extraScreenshots={extraScreenshots}
        onTooltipVisibilityChange={handleTooltipVisibilityChange}
      />

      {/* Main Content - Clean white styling */}
      <div className="w-full">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
          <div className="px-4 py-4 space-y-4 max-w-full">
            {/* Problem Statement */}
            <ContentSection
              title="Problem Statement"
              content={problemStatementData?.problem_statement}
              isLoading={!problemStatementData}
            />

            {/* Code Comparison */}
            <CodeComparisonSection
              oldCode={oldSolutionData}
              newCode={newSolutionData}
              isLoading={isProcessing}
            />

            {/* Analysis */}
            {thoughtsData && (
              <ContentSection
                title="Analysis"
                content={
                  <div className="space-y-2">
                    {thoughtsData.map((thought, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <div>{thought}</div>
                      </div>
                    ))}
                  </div>
                }
                isLoading={!thoughtsData}
              />
            )}

            {/* Complexity */}
            <ComplexitySection
              timeComplexity={timeComplexityData}
              spaceComplexity={spaceComplexityData}
              isLoading={!timeComplexityData || !spaceComplexityData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debug 