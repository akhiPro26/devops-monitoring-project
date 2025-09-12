export const SERVICE_CONFIGS = {
  USER_SERVICE: {
    name: "user-service",
    url: process.env.USER_SERVICE_URL || "http://user-service:3001",
    healthEndpoint: "/health",
    timeout: 10000,
  },
  MONITORING_SERVICE: {
    name: "monitoring-service",
    url: process.env.MONITORING_SERVICE_URL || "http://monitoring-service:3002",
    healthEndpoint: "/health",
    timeout: 15000,
  },
  AI_SERVICE: {
    name: "ai-service",
    url: process.env.AI_SERVICE_URL || "http://ai-service:3003",
    healthEndpoint: "/health",
    timeout: 30000, // AI operations may take longer
  },
  NOTIFICATION_SERVICE: {
    name: "notification-service",
    url: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3004",
    healthEndpoint: "/health",
    timeout: 10000,
  },
} as const

export const SERVICE_PERMISSIONS = {
  USER_READ: "user:read",
  USER_WRITE: "user:write",
  SERVER_READ: "server:read",
  SERVER_WRITE: "server:write",
  METRIC_READ: "metric:read",
  METRIC_WRITE: "metric:write",
  ALERT_READ: "alert:read",
  ALERT_WRITE: "alert:write",
  NOTIFICATION_SEND: "notification:send",
  AI_QUERY: "ai:query",
  AI_PREDICT: "ai:predict",
} as const
