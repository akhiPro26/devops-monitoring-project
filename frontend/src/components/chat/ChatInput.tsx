"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "../ui/button"
import { Send, Paperclip, Mic, Square } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask me anything about your infrastructure...",
}) => {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
    // Voice recording functionality would be implemented here
  }

  const suggestedQuestions = [
    "What's the current CPU usage across all servers?",
    "How can I optimize memory usage?",
    "Set up alerts for disk space monitoring",
    "Troubleshoot high network latency",
  ]

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Suggested Questions */}
      {message === "" && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-transparent"
                onClick={() => setMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                // File attachment functionality
              }}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`h-12 w-12 ${isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
            onClick={handleVoiceToggle}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button type="submit" disabled={!message.trim() || disabled} size="icon" className="h-12 w-12">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-xs">Recording... Click to stop</span>
        </div>
      )}
    </div>
  )
}
