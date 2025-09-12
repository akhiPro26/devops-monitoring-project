import type { PrismaClient } from "@prisma/client"
import * as cron from "node-cron"
import axios from "axios"
import { logger } from "../utils/logger"
import type { HealthCheckResult } from "../types"

export class HealthChecker {
  private prisma: PrismaClient
  private tasks: cron.ScheduledTask[] = []
  private timeout: number

  constructor(prisma: PrismaClient, timeout = 5000) {
    this.prisma = prisma
    this.timeout = timeout
  }

  start() {
    // Run health checks every 5 minutes
    const task = cron.schedule("*/5 * * * *", async () => {
      await this.runHealthChecks()
    })

    this.tasks.push(task)
    logger.info("Health checker started")
  }

  stop() {
    this.tasks.forEach((task) => task.stop())
    this.tasks = []
    logger.info("Health checker stopped")
  }

  private async runHealthChecks() {
    try {
      const servers = await this.prisma.server.findMany({
        where: { status: { not: "MAINTENANCE" } },
      })

      const healthCheckPromises = servers.map((server) =>
        this.checkServerHealth(server.id, server.ipAddress, server.port),
      )

      await Promise.allSettled(healthCheckPromises)
    } catch (error) {
      logger.error("Error running health checks:", error)
    }
  }

  private async checkServerHealth(serverId: string, ipAddress: string, port: number) {
    const startTime = Date.now()
    let result: HealthCheckResult

    try {
      // Simple TCP connection check (in production, you might use SSH or HTTP)
      const response = await axios.get(`http://${ipAddress}:${port}/health`, {
        timeout: this.timeout,
        validateStatus: () => true, // Accept any status code
      })

      const latency = Date.now() - startTime

      if (response.status >= 200 && response.status < 300) {
        result = {
          status: "HEALTHY",
          latency,
          response: response.data,
        }
      } else {
        result = {
          status: "UNHEALTHY",
          latency,
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
      }
    } catch (error: any) {
      const latency = Date.now() - startTime

      if (error.code === "ECONNABORTED") {
        result = {
          status: "TIMEOUT",
          latency,
          error: "Connection timeout",
        }
      } else {
        result = {
          status: "ERROR",
          latency,
          error: error.message,
        }
      }
    }

    // Store health check result
    await this.prisma.healthCheck.create({
      data: {
        serverId,
        status: result.status,
        latency: result.latency,
        error: result.error,
        response: result.response || null,
      },
    })

    // Update server status based on health check
    const newStatus = result.status === "HEALTHY" ? "ONLINE" : "OFFLINE"
    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        status: newStatus,
        lastSeen: result.status === "HEALTHY" ? new Date() : undefined,
      },
    })

    logger.debug(`Health check completed for server ${serverId}:`, result)
  }
}
