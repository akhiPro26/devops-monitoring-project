import type { PrismaClient } from "@prisma/client"
import * as cron from "node-cron"
import * as si from "systeminformation"
import { logger } from "../utils/logger"

export class MetricsCollector {
  private prisma: PrismaClient
  private tasks: cron.ScheduledTask[] = []

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  start() {
    // Collect metrics every minute
    const task = cron.schedule("* * * * *", async () => {
      await this.collectMetrics()
    })

    this.tasks.push(task)
    logger.info("Metrics collection started")
  }

  stop() {
    this.tasks.forEach((task) => task.stop())
    this.tasks = []
    logger.info("Metrics collection stopped")
  }

  private async collectMetrics() {
    try {
      const servers = await this.prisma.server.findMany({
        where: { status: { not: "MAINTENANCE" } },
      })

      for (const server of servers) {
        await this.collectServerMetrics(server.id)
      }
    } catch (error) {
      logger.error("Error collecting metrics:", error)
    }
  }

  private async collectServerMetrics(serverId: string) {
    try {
      // For demo purposes, we'll collect local system metrics
      // In production, you'd collect from remote servers via SSH/agents

      const [cpu, memory, disk, load] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize(), si.currentLoad()])

      const metrics: {
        serverId: string
        type: "CPU_USAGE" | "MEMORY_USAGE" | "LOAD_AVERAGE" | "DISK_USAGE"
        value: number
        unit: string
      }[] = [
        {
          serverId,
          type: "CPU_USAGE",
          value: cpu.currentLoad,
          unit: "%",
        },
        {
          serverId,
          type: "MEMORY_USAGE",
          value: (memory.used / memory.total) * 100,
          unit: "%",
        },
        {
          serverId,
          type: "LOAD_AVERAGE",
          value: load.avgLoad,
          unit: "",
        },
      ]

      // Add disk usage for each filesystem
      if (disk.length > 0) {
        const totalDisk = disk.reduce((acc, d) => acc + d.size, 0)
        const usedDisk = disk.reduce((acc, d) => acc + d.used, 0)

        metrics.push({
          serverId,
          type: "DISK_USAGE" as const,
          value: (usedDisk / totalDisk) * 100,
          unit: "%",
        })
      }

      // Store metrics in database
      await this.prisma.metric.createMany({
        data: metrics,
      })

      // Update server last seen
      await this.prisma.server.update({
        where: { id: serverId },
        data: {
          lastSeen: new Date(),
          status: "ONLINE",
        },
      })
    } catch (error) {
      logger.error(`Error collecting metrics for server ${serverId}:`, error)

      // Mark server as offline if we can't collect metrics
      await this.prisma.server
        .update({
          where: { id: serverId },
          data: { status: "OFFLINE" },
        })
        .catch(() => {}) // Ignore errors when updating status
    }
  }
}
