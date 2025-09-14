"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useChat } from "../context/ChatContext"
import { ChatSidebar } from "../components/chat/ChatSidebar"
import { ChatMessage } from "../components/chat/ChatMessage"
import { ChatInput } from "../components/chat/ChatInput"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Bot, Sparkles, Zap, Brain, MessageSquare, TrendingUp } from "lucide-react"

export const AIChatPage: React.FC = () => {
  const { user } = useAuth()
  const { currentSession, messages, isLoading, isTyping, sendMessage, createSession, setCurrentSession } = useChat()
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (currentSession && messages.length > 0) {
      setShowWelcome(false)
    }
  }, [currentSession, messages])

  const handleNewChat = async () => {
    if (user) {
      const newSession = await createSession(user.id)
      setCurrentSession(newSession)
      setShowWelcome(true)
    }
  }

  const handleSendMessage = async (message: string) => {
    setShowWelcome(false)
    await sendMessage(message, currentSession?.id)
  }

  const handleCopy = () => {
    // Show toast notification
    console.log("Message copied to clipboard")
  }

  const handleFeedback = (positive: boolean) => {
    // Send feedback to backend
    console.log(`Feedback: ${positive ? "positive" : "negative"}`)
  }

  const handleRegenerate = () => {
    // Regenerate last AI response
    console.log("Regenerating response...")
  }

  const welcomeCards = [
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      title: "Performance Analysis",
      description: "Get insights into CPU, memory, and disk usage patterns",
      example: "What's causing high CPU usage on server-01?",
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      title: "Alert Configuration",
      description: "Set up intelligent monitoring thresholds and notifications",
      example: "Configure memory alerts for production servers",
    },
    {
      icon: <Brain className="h-6 w-6 text-purple-600" />,
      title: "Troubleshooting",
      description: "Get step-by-step guidance for resolving system issues",
      example: "Help me troubleshoot network connectivity issues",
    },
    {
      icon: <Sparkles className="h-6 w-6 text-green-600" />,
      title: "Best Practices",
      description: "Learn DevOps monitoring recommendations and optimizations",
      example: "What are the best practices for monitoring microservices?",
    },
  ]

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-background">
      {/* Sidebar */}
      <ChatSidebar onNewChat={handleNewChat} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI DevOps Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by RAG • Ask questions about your infrastructure
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={handleNewChat}>
                <MessageSquare className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {showWelcome ? (
            <div className="p-6 max-w-4xl mx-auto">
              {/* Welcome Header */}
              <div className="text-center mb-8">
                <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Welcome to your AI DevOps Assistant</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  I'm here to help you monitor, troubleshoot, and optimize your infrastructure. Ask me anything about
                  your servers, performance metrics, alerts, or best practices.
                </p>
              </div>

              {/* Capability Cards */}
              <div className="grid gap-4 md:grid-cols-2 mb-8">
                {welcomeCards.map((card, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSendMessage(card.example)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">{card.icon}</div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-3">{card.description}</CardDescription>
                      <div className="text-sm text-primary font-medium">"{card.example}"</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Stats */}
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">24/7</div>
                      <div className="text-sm text-muted-foreground">Always Available</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">1000+</div>
                      <div className="text-sm text-muted-foreground">Knowledge Articles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">Less than 2 seconds</div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message.message}
                  isUser={index % 2 === 0}
                  timestamp={message.timestamp}
                  onCopy={handleCopy}
                  onFeedback={handleFeedback}
                  onRegenerate={handleRegenerate}
                />
              ))}
              {isTyping && (
                <ChatMessage message="" isUser={false} timestamp={new Date().toISOString()} isTyping={true} />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}
