// backend/services/monitoring/src/service/metricsCollector.ts

import type { PrismaClient } from "@prisma/client"
import * as cron from "node-cron"
import * as si from "systeminformation"
import { logger } from "../utils/logger"
import { ServiceClient } from "../../../../shared/utils/serviceClient"
import type { Server } from "../../../../shared/types"

export class MetricsCollector {
  private prisma: PrismaClient
  private tasks: cron.ScheduledTask[] = []
  private userService: ServiceClient // New service client

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.userService = new ServiceClient("users") // Initialize the client
  }

  start() {
    // Collect metrics every minute
    // console.log("hello")
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
      // Step 1: Get servers from the users service via API call
      const serverResponse = await this.userService.getAllServers(); // This is a new method you need to add to ServiceClient
      console.log("hello this data is from server = ",serverResponse);
      if (!serverResponse) {
        logger.error("Failed to fetch servers from user service.");
        return;
      }
      const servers:any = serverResponse;

      for (const server of servers) {
        await this.collectServerMetrics(server.id); // Pass the server ID to the collection method
      }
    } catch (error) {
      logger.error("Error collecting metrics:", error);
    }
  }

  private async collectServerMetrics(serverId: string) {
    try {
      // Step 2: Use the existing logic to collect local metrics
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

      // Store metrics in the now-centralized database, which its Prisma client can access
      await this.prisma.metric.createMany({
        data: metrics,
      })

      // Step 3: Update server status by calling the users service API
      await this.userService.updateServerStatus(serverId, "ONLINE") // You need to add this method to ServiceClient
    } catch (error) {
      logger.error(`Error collecting metrics for server ${serverId}:`, error)

      // Mark server as offline if we can't collect metrics via API call
      await this.userService
        .updateServerStatus(serverId, "OFFLINE") // Update via API call
        .catch(() => {})
    }
  }
}