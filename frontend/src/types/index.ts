    import { z } from "zod"

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

// Server Types
export const ServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostname: z.string(),
  ipAddress: z.string(),
  port: z.number().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "UNKNOWN", "MAINTENANCE"]),
  environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
  description: z.string().optional(),
  teamId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Metrics Types
export const MetricSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  type: z.enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_USAGE", "NETWORK_IN", "NETWORK_OUT", "LOAD_AVERAGE", "UPTIME"]),
  value: z.number(),
  timestamp: z.string(),
})

export const MetricSummarySchema = z.object({
  serverId: z.string(),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
  diskUsage: z.number(),
  networkIn: z.number(),
  networkOut: z.number(),
  loadAverage: z.number(),
  uptime: z.number(),
  lastUpdated: z.string(),
})

// Alert Types
export const AlertSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  type: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]),
  title: z.string(),
  message: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// AI Chat Types
export const ChatMessageSchema = z.object({
  id: z.string(),
  message: z.string(),
  response: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  timestamp: z.string(),
})

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.string(),
  messages: z.array(ChatMessageSchema),
})

// Notification Types
export const NotificationChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["email", "sms", "webhook", "slack"]),
  config: z.record(z.string(), z.unknown()),
  isActive: z.boolean(),
  createdAt: z.string(),
})

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  recipient: z.string(),
  channelType: z.string(),
  status: z.enum(["PENDING", "SENT", "FAILED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  createdAt: z.string(),
})

// Export types
export type User = z.infer<typeof UserSchema>
export type LoginData = z.infer<typeof LoginSchema>
export type RegisterData = z.infer<typeof RegisterSchema>
export type Server = z.infer<typeof ServerSchema>
export type Metric = z.infer<typeof MetricSchema>
export type MetricSummary = z.infer<typeof MetricSummarySchema>
export type Alert = z.infer<typeof AlertSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatSession = z.infer<typeof ChatSessionSchema>
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>
export type Notification = z.infer<typeof NotificationSchema>
