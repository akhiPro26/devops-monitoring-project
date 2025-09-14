"use client"

import type React from "react"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface ChatMessageProps {
  message: string
  isUser: boolean
  timestamp: string
  isTyping?: boolean
  onCopy?: () => void
  onFeedback?: (positive: boolean) => void
  onRegenerate?: () => void
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  onCopy,
  onFeedback,
  onRegenerate,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    onCopy?.()
  }

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 mb-6">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
        <Card className="flex-1 p-4 bg-muted/50">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`flex items-start space-x-3 mb-6 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-secondary" : "bg-primary"}`}
        >
          {isUser ? (
            <User className="h-4 w-4 text-secondary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-primary-foreground" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <Card className={`p-4 ${isUser ? "bg-secondary/50" : "bg-muted/50"}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {isUser ? "You" : "AI Assistant"}
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(timestamp), "HH:mm")}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{message}</div>
            </div>
          </div>
        </Card>

        {!isUser && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2 text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback?.(true)}
              className="h-8 px-2 text-xs hover:text-green-600"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Helpful
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback?.(false)}
              className="h-8 px-2 text-xs hover:text-red-600"
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              Not helpful
            </Button>
            <Button variant="ghost" size="sm" onClick={onRegenerate} className="h-8 px-2 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
