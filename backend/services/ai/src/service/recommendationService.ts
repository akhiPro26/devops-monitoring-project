import { PrismaClient } from "@prisma/client"
import axios from "axios"
import { logger } from "../utils/logger"

const prisma = new PrismaClient()

export class RecommendationService {
  async generateRecommendations(serverId: string) {
    try {
      // Fetch server metrics and alerts
      const [metricsResponse, alertsResponse] = await Promise.all([
        axios.get(`http://monitoring-service:3002/api/metrics/server/${serverId}?limit=50`),
        axios.get(`http://monitoring-service:3002/api/alerts?serverId=${serverId}&status=active`),
      ])

      const metrics = metricsResponse.data.data
      const alerts = alertsResponse.data.data

      const recommendations:any = []

      // Analyze CPU usage
      const cpuMetrics = metrics.filter((m:any) => m.metricType === "cpu")
      if (cpuMetrics.length > 0) {
        const avgCpu = cpuMetrics.reduce((sum:any, m:any) => sum + m.value, 0) / cpuMetrics.length

        if (avgCpu > 80) {
          recommendations.push({
            serverId,
            type: "performance",
            title: "High CPU Usage Detected",
            description: `Average CPU usage is ${avgCpu.toFixed(1)}%. Consider scaling up or optimizing processes.`,
            priority: "high",
            category: "performance",
            confidence: 0.9,
            impact: "high",
            effort: "medium",
          })
        }
      }

      // Analyze memory usage
      const memoryMetrics = metrics.filter((m:any) => m.metricType === "memory")
      if (memoryMetrics.length > 0) {
        const avgMemory = memoryMetrics.reduce((sum:any, m:any) => sum + m.value, 0) / memoryMetrics.length

        if (avgMemory > 85) {
          recommendations.push({
            serverId,
            type: "performance",
            title: "High Memory Usage",
            description: `Memory usage is at ${avgMemory.toFixed(1)}%. Consider adding more RAM or optimizing memory usage.`,
            priority: "high",
            category: "performance",
            confidence: 0.85,
            impact: "high",
            effort: "low",
          })
        }
      }

      // Analyze disk usage
      const diskMetrics = metrics.filter((m:any) => m.metricType === "disk")
      if (diskMetrics.length > 0) {
        const avgDisk = diskMetrics.reduce((sum:any, m:any) => sum + m.value, 0) / diskMetrics.length

        if (avgDisk > 90) {
          recommendations.push({
            serverId,
            type: "maintenance",
            title: "Disk Space Critical",
            description: `Disk usage is at ${avgDisk.toFixed(1)}%. Immediate cleanup or expansion required.`,
            priority: "critical",
            category: "storage",
            confidence: 0.95,
            impact: "critical",
            effort: "low",
          })
        } else if (avgDisk > 75) {
          recommendations.push({
            serverId,
            type: "maintenance",
            title: "Disk Space Warning",
            description: `Disk usage is at ${avgDisk.toFixed(1)}%. Plan for cleanup or expansion.`,
            priority: "medium",
            category: "storage",
            confidence: 0.8,
            impact: "medium",
            effort: "low",
          })
        }
      }

      // Analyze alert patterns
      if (alerts.length > 5) {
        recommendations.push({
          serverId,
          type: "monitoring",
          title: "High Alert Volume",
          description: `${alerts.length} active alerts detected. Review alert thresholds and investigate root causes.`,
          priority: "medium",
          category: "monitoring",
          confidence: 0.7,
          impact: "medium",
          effort: "medium",
        })
      }

      // Save recommendations
      const savedRecommendations = await Promise.all(
        recommendations.map((rec:any) => prisma.recommendation.create({ data: rec })),
      )

      return savedRecommendations
    } catch (error) {
      logger.error("Error generating recommendations:", error)
      throw error
    }
  }
}
