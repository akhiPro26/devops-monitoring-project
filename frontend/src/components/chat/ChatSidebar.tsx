"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { useChat } from "../../context/ChatContext"
import type { ChatSession } from "../../types"
import { Plus, MessageSquare, Clock, Search, MoreVertical } from "lucide-react"
import { format } from "date-fns"

interface ChatSidebarProps {
  onNewChat: () => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onNewChat }) => {
  const { sessions, currentSession, setCurrentSession } = useChat()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSessions = sessions.filter((session) => session.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSessionClick = (session: ChatSession) => {
    setCurrentSession(session)
  }

  const getSessionPreview = (session: ChatSession) => {
    const lastMessage = session.messages[session.messages.length - 1]
    if (!lastMessage) return "New conversation"
    return lastMessage.message.length > 50 ? `${lastMessage.message.substring(0, 50)}...` : lastMessage.message
  }

  return (
    <div className="w-80 border-r border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <Button onClick={onNewChat} size="sm" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => onNewChat()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask about server performance
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => onNewChat()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Configure monitoring alerts
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => onNewChat()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Troubleshoot system issues
          </Button>
        </div>
      </div>

      {/* Chat Sessions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Conversations</h3>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-sm font-medium mb-2">No conversations yet</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Start a new chat to get help with your DevOps monitoring
              </p>
              <Button onClick={onNewChat} size="sm">
                Start Chatting
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                    currentSession?.id === session.id ? "bg-accent border-accent-foreground/20" : ""
                  }`}
                  onClick={() => handleSessionClick(session)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{session.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{getSessionPreview(session)}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(session.createdAt), "MMM dd, HH:mm")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {session.messages.length} messages
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>AI Assistant powered by RAG</p>
          <p>Ask questions about your infrastructure</p>
        </div>
      </div>
    </div>
  )
}
