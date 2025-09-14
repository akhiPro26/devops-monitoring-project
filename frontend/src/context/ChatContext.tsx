"use client"

import type React from "react"
import { createContext, useContext, useReducer } from "react"
import type { ChatSession, ChatMessage } from "../types"
import { aiApi } from "../lib/api"

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  isLoading: boolean
  isTyping: boolean
  error: string | null
}

type ChatAction =
  | { type: "FETCH_SESSIONS_START" }
  | { type: "FETCH_SESSIONS_SUCCESS"; payload: ChatSession[] }
  | { type: "FETCH_SESSIONS_FAILURE"; payload: string }
  | { type: "SET_CURRENT_SESSION"; payload: ChatSession | null }
  | { type: "SEND_MESSAGE_START" }
  | { type: "SEND_MESSAGE_SUCCESS"; payload: { message: ChatMessage; response: string } }
  | { type: "SEND_MESSAGE_FAILURE"; payload: string }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "CLEAR_ERROR" }

const initialState: ChatState = {
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
}

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "FETCH_SESSIONS_START":
      return { ...state, isLoading: true, error: null }
    case "FETCH_SESSIONS_SUCCESS":
      return { ...state, isLoading: false, sessions: action.payload, error: null }
    case "FETCH_SESSIONS_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "SET_CURRENT_SESSION":
      return { ...state, currentSession: action.payload, messages: action.payload?.messages || [] }
    case "SEND_MESSAGE_START":
      return { ...state, isLoading: true, error: null }
    case "SEND_MESSAGE_SUCCESS":
      const newMessages = [
        ...state.messages,
        action.payload.message,
        {
          ...action.payload.message,
          id: `response-${Date.now()}`,
          message: action.payload.response,
          response: "",
          timestamp: new Date().toISOString(),
        },
      ]
      return { ...state, isLoading: false, messages: newMessages, error: null }
    case "SEND_MESSAGE_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_TYPING":
      return { ...state, isTyping: action.payload }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface ChatContextType extends ChatState {
  fetchSessions: (userId: string) => Promise<void>
  createSession: (userId: string) => Promise<ChatSession>
  setCurrentSession: (session: ChatSession | null) => void
  sendMessage: (message: string, sessionId?: string, context?: Record<string, any>) => Promise<void>
  clearError: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const fetchSessions = async (userId: string) => {
    dispatch({ type: "FETCH_SESSIONS_START" })
    try {
      const response = await aiApi.get(`/chat/sessions/${userId}`)
      dispatch({ type: "FETCH_SESSIONS_SUCCESS", payload: response.data.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch chat sessions"
      dispatch({ type: "FETCH_SESSIONS_FAILURE", payload: message })
    }
  }

  const createSession = async (userId: string): Promise<ChatSession> => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      userId,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
    }
    return newSession
  }

  const setCurrentSession = (session: ChatSession | null) => {
    dispatch({ type: "SET_CURRENT_SESSION", payload: session })
  }

  const sendMessage = async (message: string, sessionId?: string, context?: Record<string, any>) => {
    dispatch({ type: "SEND_MESSAGE_START" })
    dispatch({ type: "SET_TYPING", payload: true })

    try {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        message,
        response: "",
        sessionId: sessionId || state.currentSession?.id || "default",
        userId: "current-user", // This would come from auth context
        timestamp: new Date().toISOString(),
      }

      // Simulate AI response delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock AI response based on message content
      let aiResponse = "I'm here to help with your DevOps monitoring questions. "

      if (message.toLowerCase().includes("cpu") || message.toLowerCase().includes("performance")) {
        aiResponse =
          "Based on your server metrics, I can see CPU usage patterns. Here are some recommendations:\n\n1. **Current Status**: Your average CPU usage is around 45-52%\n2. **Optimization**: Consider load balancing if usage consistently exceeds 80%\n3. **Monitoring**: Set up alerts for CPU usage above 85%\n\nWould you like me to help you configure specific CPU monitoring alerts?"
      } else if (message.toLowerCase().includes("memory") || message.toLowerCase().includes("ram")) {
        aiResponse =
          "Memory management is crucial for system stability. Here's what I found:\n\n1. **Current Usage**: Memory utilization is at 67-71%\n2. **Recommendations**: \n   - Monitor for memory leaks in applications\n   - Consider adding swap space if physical RAM is limited\n   - Set alerts for memory usage above 90%\n\n3. **Best Practices**: Regular memory cleanup and application optimization\n\nShall I help you set up memory monitoring rules?"
      } else if (message.toLowerCase().includes("disk") || message.toLowerCase().includes("storage")) {
        aiResponse =
          "Disk space monitoring is essential for preventing outages:\n\n1. **Current Status**: Disk usage appears healthy at ~34-56%\n2. **Preventive Measures**:\n   - Set up alerts at 80% and 90% capacity\n   - Implement log rotation policies\n   - Monitor disk I/O performance\n\n3. **Cleanup Strategies**: Remove old logs, temporary files, and unused applications\n\nWould you like help configuring disk space alerts?"
      } else if (message.toLowerCase().includes("alert") || message.toLowerCase().includes("notification")) {
        aiResponse =
          "Alert management is key to proactive monitoring:\n\n1. **Current Alerts**: You have 3 active alerts\n2. **Best Practices**:\n   - Set appropriate thresholds to avoid alert fatigue\n   - Use escalation policies for critical issues\n   - Group related alerts to reduce noise\n\n3. **Recommendations**: \n   - Critical: CPU > 90%, Memory > 95%, Disk > 95%\n   - Warning: CPU > 80%, Memory > 85%, Disk > 85%\n\nShall I help you configure these alert rules?"
      } else if (message.toLowerCase().includes("server") || message.toLowerCase().includes("infrastructure")) {
        aiResponse =
          "Your infrastructure overview:\n\n1. **Server Status**: 22/24 servers online (91.7% uptime)\n2. **Health Check**: Most systems running normally\n3. **Recommendations**:\n   - Investigate the 2 offline servers\n   - Consider redundancy for critical services\n   - Regular health checks and maintenance windows\n\n4. **Monitoring**: Ensure all servers have monitoring agents installed\n\nWould you like me to help troubleshoot the offline servers?"
      } else {
        aiResponse += `I can help you with:\n\n• **Performance Analysis** - CPU, memory, disk usage insights\n• **Alert Configuration** - Setting up monitoring thresholds\n• **Troubleshooting** - Diagnosing system issues\n• **Best Practices** - DevOps monitoring recommendations\n• **Infrastructure Health** - Server status and optimization\n\nWhat specific area would you like assistance with?`
      }

      dispatch({
        type: "SEND_MESSAGE_SUCCESS",
        payload: { message: userMessage, response: aiResponse },
      })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to send message"
      dispatch({ type: "SEND_MESSAGE_FAILURE", payload: message })
    } finally {
      dispatch({ type: "SET_TYPING", payload: false })
    }
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  return (
    <ChatContext.Provider
      value={{
        ...state,
        fetchSessions,
        createSession,
        setCurrentSession,
        sendMessage,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
