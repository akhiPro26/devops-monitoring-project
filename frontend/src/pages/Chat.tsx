"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { aiAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Send, MessageSquare, Bot, User, Trash2, Plus } from "lucide-react"
import type { ChatSession } from "../types"

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewChatInput, setShowNewChatInput] = useState(false) // New state for showing input
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  // Fetch sessions when user changes
  useEffect(() => {
    if (user) {
      fetchSessions()
    } else {
      setSessions([])
      setCurrentSession(null)
      setShowNewChatInput(false)
    }
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchSessions = useCallback(async () => {
    if (!user) return

    setSessionsLoading(true)
    setError(null)

    try {
      const response = await aiAPI.getChatSessions(user.id)
      const sessionsData = response.data.data || []
      setSessions(sessionsData)
      console.log(sessionsData)
      
      // If we have sessions but no current session selected, don't auto-select
      // Let user choose or start new chat
    } catch (error) {
      console.error("Error fetching chat sessions:", error)
      setError("Failed to load chat sessions")
    } finally {
      setSessionsLoading(false)
    }
  }, [user])

  const startNewChat = useCallback(() => {
    setCurrentSession(null)
    setShowNewChatInput(true) // Show input form for new chat
    setMessage("")
    setError(null)
  }, [])

  const selectSession = useCallback((session: ChatSession) => {
    setCurrentSession(session)
    setShowNewChatInput(false) // Hide new chat input when selecting existing session
    setError(null)
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user || loading) return

    const userMessage = message.trim()
    setMessage("")
    setLoading(true)
    setError(null)

    // Create user message object
    const userMsg = {
      role: "user" as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    }

    // If we're in new chat mode, create a temporary session
    if (!currentSession || showNewChatInput) {
      const tempSession: ChatSession = {
        id: `temp-${Date.now()}`,
        title: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""),
        messages: [userMsg],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }
      setCurrentSession(tempSession)
      setShowNewChatInput(false) // Hide new chat input once we start chatting
    } else {
      // Add to existing session
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMsg]
      } : null)
    }

    try {
      const response = await aiAPI.sendChatMessage({
        message: userMessage,
        sessionId: currentSession?.id?.startsWith('temp-') ? undefined : currentSession?.id,
        userId: user.id,
        context: {
          category: "general",
        },
      })

      const { sessionId, response: aiResponse } = response.data.data

      const assistantMsg = {
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }

      // Create or update session with AI response
      const updatedSession: ChatSession = {
        id: sessionId,
        title: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""),
        messages: [userMsg, assistantMsg],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: user.id
      }

      setCurrentSession(updatedSession)

      // Update sessions list
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === sessionId)
        if (existingIndex >= 0) {
          // Update existing session
          const updated = [...prev]
          updated[existingIndex] = updatedSession
          return updated
        } else {
          // Add new session to the beginning
          return [updatedSession, ...prev]
        }
      })

    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message. Please try again.")
      setMessage(userMessage) // Restore message on error
      
      // If this was a new chat, go back to new chat input mode
      if (currentSession?.id?.startsWith('temp-')) {
        setCurrentSession(null)
        setShowNewChatInput(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this chat session?")) {
      return
    }

    try {
      // Add your delete API call here if you have one
      // await aiAPI.deleteChatSession(sessionId)
      
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setShowNewChatInput(false)
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      setError("Failed to delete session")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as any)
    }
  }

  // Determine what to show in the main chat area
  const shouldShowChatInput = currentSession || showNewChatInput
  const shouldShowWelcomeScreen = !currentSession && !showNewChatInput && sessions.length === 0

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewChat}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No chat history yet</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => selectSession(session)}
                className={`group p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                  currentSession?.id === session.id ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate pr-2">{session.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{session.messages.length} messages</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {shouldShowChatInput ? (
          <>
            {/* Header */}
            {currentSession && (
              <div className="bg-white border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {currentSession.title}
                </h2>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentSession?.messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg shadow-sm ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 mr-2" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-xs font-medium opacity-75">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2 animate-pulse" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Error display */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Message Input - Always show when in chat mode */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex space-x-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      showNewChatInput 
                        ? "Start your conversation here..." 
                        : "Continue the conversation..."
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={loading}
                    rows={1}
                    style={{
                      minHeight: '44px',
                      maxHeight: '120px',
                      resize: 'none',
                    }}
                    autoFocus={showNewChatInput} // Auto focus when starting new chat
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center max-w-md mx-auto p-8">
              <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Welcome to AI Chat
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Start a conversation by clicking "New Chat" above, or select an existing 
                chat from the sidebar to continue where you left off.
              </p>
              <button 
                onClick={startNewChat} 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Your First Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat