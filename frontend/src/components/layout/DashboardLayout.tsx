"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../../components/ui/button"
import {
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Server,
  BarChart3,
  MessageSquare,
  Users,
  AlertTriangle,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Servers", href: "/servers", icon: Server },
  { name: "Monitoring", href: "/monitoring", icon: Activity }, // Added monitoring navigation
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "AI Assistant", href: "/ai-chat", icon: MessageSquare },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-sidebar-primary rounded-lg">
                <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-5 w-5 text-sidebar-accent" />
                <span className="text-lg font-bold text-sidebar-foreground">DevOps Monitor</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {user?.firstName?.[0] || user?.username?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-foreground hover:text-primary">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
