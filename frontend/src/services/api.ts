import axios from "axios"

const API_BASE_URL = "http://localhost:3000"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API
export const authAPI = {
  register: (data: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
  }) => api.post("/api/auth/register", data),

  login: (data: { email: string; password: string }) => api.post("/api/auth/login", data),

  me: () => api.get("/api/auth/me"),
}

// Teams API
export const teamsAPI = {
  create: (data: { name: string; description: string }) => api.post("/api/teams", data),

  getMyTeams: () => api.get("/api/teams/my-team"),

  getById: (id: string) => api.get(`/api/teams/${id}`),

  update: (id: string, data: { name?: string; description?: string }) => api.put(`/api/teams/${id}`, data),

  delete: (id: string) => api.delete(`/api/teams/${id}`),

  addMember: (teamId: string, data: { userId: string; role: string }) => api.post(`/api/teams/${teamId}/members`, data),

  removeMember: (teamId: string, memberId: string) => api.delete(`/api/teams/${teamId}/members/${memberId}`),
}

// Servers API
export const serversAPI = {
  create: (data: {
    name: string
    hostname: string
    ipAddress: string
    environment: string
    description: string
    teamId: string
  }) => api.post("/api/servers", data),

  getAll: () => api.get("/api/servers"),

  getById: (id: string) => api.get(`/api/servers/${id}`),

  update: (id: string, data: any) => api.put(`/api/servers/${id}`, data),

  delete: (id: string) => api.delete(`/api/servers/${id}`),
}

// Monitoring API
export const monitoringAPI = {
  getMetrics: () => api.get("/api/monitoring/metrics"),

  getMetricsSummary: (serverId: string) => api.get(`/api/monitoring/metrics/summary/${serverId}`),

  getMetricsHistory: (serverId: string, type: string, hours = 24) =>
    api.get(`/api/monitoring/metrics/history/${serverId}/${type}?hours=${hours}`),

  getServers: () => api.get("/api/monitoring/servers"),

  createServer: (data: any) => api.post("/api/monitoring/servers", data),

  updateServer: (id: string, data: any) => api.put(`/api/monitoring/servers/${id}`, data),

  deleteServer: (id: string) => api.delete(`/api/monitoring/servers/${id}`),

  getAlerts: () => api.get("/api/monitoring/alerts"),

  getActiveAlerts: () => api.get("/api/monitoring/alerts/active"),

  updateAlert: (id: string, data: { status: string }) => api.put(`/api/monitoring/alerts/${id}`, data),

  deleteAlert: (id: string) => api.delete(`/api/monitoring/alerts/${id}`),

  getHealthChecks: (serverId: string) => api.get(`/api/health/checks/${serverId}`),
}

// AI API
export const aiAPI = {
  queryRAG: (data: { query: string }) => api.post("/api/ai/rag/query", data),

  createDocument: (data: {
    title: string
    content: string
    source: string
    category: string
  }) => api.post("/api/ai/rag/documents", data),

  getDocuments: () => api.get("/api/ai/rag/documents"),

  deleteDocument: (id: string) => api.delete(`/api/ai/rag/documents/${id}`),

  generatePrediction: (data: {
    serverId: string
    metricType: string
    timeframe: string
  }) => api.post("/api/ai/predictions/generate", data),

  getPredictions: (serverId: string) => api.get(`/api/ai/predictions/server/${serverId}`),

  getPredictionAccuracy: (serverId: string) => api.get(`/api/ai/predictions/accuracy/${serverId}`),

  sendChatMessage: (data: {
    message: string
    sessionId?: string
    userId: string
    context?: any
  }) => api.post("/api/ai/chat/message", data),

  getChatSessions: (userId: string) => api.get(`/api/ai/chat/sessions/${userId}`),
}

// Notifications API
export const notificationsAPI = {
  send: (data: {
    type: string
    title: string
    message: string
    recipient: string
    channelType: string
    priority: string
    templateId?: string
    metadata?: any
  }) => api.post("/api/notifications/send", data),

  getAll: () => api.get("/api/notifications"),

  getById: (id: string) => api.get(`/api/notifications/${id}`),

  retry: (id: string) => api.post(`/api/notifications/${id}/retry`),

  getStats: () => api.get("/api/notifications/stats/overview"),

  // Template management
  createTemplate: (data: {
    name: string
    type: string
    subject: string
    body: string
    variables: string[]
    isActive: boolean
  }) => api.post("/api/notifications/templates", data),

  getTemplates: () => api.get("/api/notifications/templates"),

  getTemplate: (id: string) => api.get(`/api/notifications/templates/${id}`),

  deleteTemplate: (id: string) => api.delete(`/api/notifications/templates/${id}`),

  // Subscription management
  createSubscription: (data: {
    userId: string
    serverId: string
    alertType: string
    channels: string[]
    isActive: boolean
  }) => api.post("/api/notifications/subscriptions", data),

  getUserSubscriptions: (userId: string) => api.get(`/api/notifications/subscriptions/user/${userId}`),

  updateSubscription: (id: string, data: { channels: string[] }) =>
    api.put(`/api/notifications/subscriptions/${id}`, data),

  deleteSubscription: (id: string) => api.delete(`/api/notifications/subscriptions/${id}`),
}
