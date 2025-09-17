export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  role: "USER" | "ADMIN"
  createdAt: string
  teamMemberships?: TeamMembership[]
}

export interface Team {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  creatorId: string
  creator: {
    id: string
    username: string
    email: string
  }
  members: TeamMember[]
  servers: Server[]
}

export interface TeamMembership {
  id: string
  teamId: string
  userId: string
  role: string
  joinedAt: string
}

export interface TeamMember {
  id: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  joinedAt: string
  userId: string
  teamId: string
  user: {
    id: string
    username: string
    email: string
  }
}

export interface Server {
  id: string
  name: string
  hostname: string
  ipAddress: string
  environment: "DEVELOPMENT" | "STAGING" | "PRODUCTION"
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE"
  description: string
  createdAt: string
  updatedAt: string
  teamId: string
  team: {
    id: string
    name: string
  }
  serverAccess?: {
    permissions: string[]
  }[]
}

export interface Metric {
  id: string
  serverId: string
  type: "CPU_USAGE" | "MEMORY_USAGE" | "DISK_USAGE" | "NETWORK_IN" | "NETWORK_OUT" | "LOAD_AVERAGE" | "UPTIME"
  value: number
  unit: string
  timestamp: string
  server: {
    id: string
    name: string
    hostname: string
  }
}

export interface Alert {
  id: string
  serverId: string
  type: string
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  message: string
  threshold: number
  currentValue: number
  status: "ACTIVE" | "RESOLVED"
  createdAt: string
  resolvedAt: string | null
  server: {
    id: string
    name: string
    hostname: string
  }
}

export interface Document {
  id: string
  title: string
  content: string
  source: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ChatSession {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  context: any
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface NotificationTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  serverId: string
  alertType: string
  channels: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  recipient: string
  channelType: string
  status: "pending" | "sent" | "failed" | "delivered"
  priority: string
  metadata: any
  sentAt: string | null
  deliveredAt: string | null
  failedAt: string | null
  error: string | null
  retryCount: number
  maxRetries: number
  createdAt: string
  updatedAt: string
  templateId: string | null
  channelId: string | null
  template?: NotificationTemplate
}

export interface NotificationStats {
  total: number
  sent: number
  failed: number
  pending: number
  deliveryRate: number
}
