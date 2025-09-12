// Shared types across all services
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "user"
  teamId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  ownerId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Server {
  id: string
  name: string
  hostname: string
  ipAddress: string
  port: number
  status: "active" | "inactive" | "maintenance"
  teamId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Metric {
  id: string
  serverId: string
  metricType: "cpu" | "memory" | "disk" | "network"
  value: number
  unit: string
  timestamp: Date
}

export interface Alert {
  id: string
  serverId: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  status: "active" | "resolved" | "acknowledged"
  triggeredAt: Date
  resolvedAt?: Date
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  recipient: string
  channelType: string
  status: "pending" | "sent" | "failed" | "delivered"
  priority: "low" | "medium" | "high" | "critical"
  createdAt: Date
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ServiceResponse<T[]> {
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
