"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { aiAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Send, MessageSquare, Bot, User } from "lucide-react"
import type { ChatSession } from "../types"

const Chat: React.FC = () => {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchSessions = async () => {
    if (!user) return

    try {
      const response = await aiAPI.getChatSessions(user.id)
      setSessions(response.data.data)
      if (response.data.data.length > 0) {
        setCurrentSession(response.data.data[0])
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user || loading) return

    setLoading(true)
    const userMessage = message
    setMessage("")

    try {
      const response = await aiAPI.sendChatMessage({
        message: userMessage,
        sessionId: currentSession?.id,
        userId: user.id,
        context: {
          category: "general",
        },
      })

      const { sessionId, response: aiResponse, sources } = response.data.data

      // Update current session or create new one
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession({
          ...currentSession,
          messages: [
            ...currentSession.messages,
            {
              role: "user",
              content: userMessage,
              timestamp: new Date().toISOString(),
            },
            {
              role: "assistant",
              content: aiResponse,
              timestamp: new Date().toISOString(),
            },
          ],
        })
      } else {
        // New session created
        await fetchSessions()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const startNewChat = () => {
    setCurrentSession(null)
  }

  return (
    <div className="h-full flex">
      {/* Sidebar with chat sessions */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewChat}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setCurrentSession(session)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                currentSession?.id === session.id ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <p className="font-medium text-gray-900 truncate">{session.title}</p>
              <p className="text-sm text-gray-500 mt-1">{session.messages.length} messages</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(session.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentSession.messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {msg.role === "user" ? <User className="h-4 w-4 mr-2" /> : <Bot className="h-4 w-4 mr-2" />}
                      <span className="text-xs opacity-75">{msg.role === "user" ? "You" : "AI Assistant"}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-75 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center">
                      <Bot className="h-4 w-4 mr-2" />
                      <span className="text-xs">AI Assistant is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about your servers, metrics, or anything else..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new conversation</h3>
              <p className="text-gray-500 mb-4">
                Ask questions about your servers, get insights, or chat about monitoring.
              </p>
              <button onClick={startNewChat} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Start Chatting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
