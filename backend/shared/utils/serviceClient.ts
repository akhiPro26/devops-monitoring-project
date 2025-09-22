import { ServiceRegistry } from "./serviceRegistry"
import { SERVICE_CONFIGS } from "../config/services"
import { generateServiceToken } from "../middleware/serviceAuth"
import type { User, Server, Metric, Alert, Notification, ServiceResponse } from "../types"

export class ServiceClient {
  private registry: ServiceRegistry
  private serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
    this.registry = new ServiceRegistry(Object.values(SERVICE_CONFIGS))
    this.setupServiceAuthentication()
  }

  private setupServiceAuthentication() {
    // Set service tokens for inter-service communication
    const services = this.registry.getAllServicesHealth()
    for (const [name] of Object.entries(services)) {
      const client = this.registry.getService(name)
      if (client) {
        const token = generateServiceToken(this.serviceName, ["*"]) // Grant all permissions for simplicity
        client.setAuthToken(token)
      }
    }
  }

  // User Service Methods
  async getUser(userId: string): Promise<ServiceResponse<User>> {
    return this.registry.callService("user-service", (client) => client.get(`/users/${userId}`))
  }

  // async getUserByEmail(email: string): Promise<ServiceResponse<User>> {
  //   return this.registry.callService("user-service", (client) => client.get(`/api/users/email/${email}`))
  // }

  async getAllServers(): Promise<ServiceResponse<Server[]>> {
  return this.registry.callService("user-service", (client) => client.get(`/servers/inter-service/all-servers`));
}


   // NEW METHOD to retrieve server from user service
  async getUserServiceServer(serverId: string): Promise<ServiceResponse<Server>> {
    return this.registry.callService("user-service", (client) => client.get(`/servers//inter-service/server/${serverId}`))
  }

  async updateServerStatus(serverId: string, status: "ONLINE" | "OFFLINE"): Promise<ServiceResponse<Server>> {
    return this.registry.callService("user-service", (client) =>
      client.put(`/servers/inter-service/server/${serverId}`, { status }),
    )
  }


  async verifyToken(token: string): Promise<ServiceResponse<User>> {
    return this.registry.callService("user-service", (client) =>
      client.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
  }

  // Monitoring Service Methods
  async getServer(serverId: string): Promise<ServiceResponse<Server>> {
    return this.registry.callService("monitoring-service", (client) => client.get(`/api/servers/${serverId}`))
  }

  async getServerMetrics(
    serverId: string,
    options?: { limit?: number; metricType?: string },
  ): Promise<ServiceResponse<Metric[]>> {
    const params = new URLSearchParams()
    if (options?.limit) params.append("limit", options.limit.toString())
    if (options?.metricType) params.append("metricType", options.metricType)

    return this.registry.callService("monitoring-service", (client) =>
      client.get(`/api/metrics/server/${serverId}?${params.toString()}`),
    )
  }

  async getActiveAlerts(serverId?: string): Promise<ServiceResponse<Alert[]>> {
    const params = serverId ? `?serverId=${serverId}&status=active` : "?status=active"
    return this.registry.callService("monitoring-service", (client) => client.get(`/api/alerts${params}`))
  }

  // Notification Service Methods
  async sendNotification(notification: {
    type: string
    title: string
    message: string
    recipient: string
    channelType: string
    priority?: string
  }): Promise<ServiceResponse<Notification>> {
    return this.registry.callService("notification-service", (client) =>
      client.post("/api/notifications/send", notification),
    )
  }

  async sendBulkNotifications(notifications: any[]): Promise<ServiceResponse<any[]>> {
    return this.registry.callService("notification-service", (client) =>
      client.post("/api/notifications/send-bulk", { notifications }),
    )
  }

  // AI Service Methods
  async queryRAG(query: string, context?: { serverId?: string; category?: string }): Promise<ServiceResponse<any>> {
    return this.registry.callService("ai-service", (client) => client.post("/api/rag/query", { query, context }))
  }

  async generatePrediction(data: {
    serverId: string
    metricType: string
    timeframe: string
  }): Promise<ServiceResponse<any>> {
    return this.registry.callService("ai-service", (client) => client.post("/api/predictions/generate", data))
  }

  async generateRecommendations(serverId: string): Promise<ServiceResponse<any[]>> {
    return this.registry.callService("ai-service", (client) => client.post(`/api/recommendations/generate/${serverId}`))
  }

  // Health Check Methods
  getServiceHealth(serviceName: string): boolean {
    return this.registry.getServiceHealth(serviceName)
  }

  getAllServicesHealth(): Record<string, boolean> {
    return this.registry.getAllServicesHealth()
  }
}
