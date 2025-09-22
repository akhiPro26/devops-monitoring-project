import type { AlertType, PrismaClient } from "@prisma/client"
import * as cron from "node-cron"
import { logger } from "../utils/logger"
import { EventBus, EventTypes } from "../../../../shared/utils/eventBus" // Import the EventBus

export class AlertManager {
  private prisma: PrismaClient
  private tasks: cron.ScheduledTask[] = []
  private eventBus: EventBus // New event bus instance

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.eventBus = EventBus.getInstance("monitoring-service") // Initialize EventBus
  }

  start() {
    // Check for alerts every 30 seconds
    const task = cron.schedule("*/30 * * * * *", async () => {
      await this.checkAlerts()
    })

    this.tasks.push(task)
    logger.info("Alert manager started")
  }

  stop() {
    this.tasks.forEach((task) => task.stop())
    this.tasks = []
    logger.info("Alert manager stopped")
  }

  private async checkAlerts() {
    try {
      const alertRules = await this.prisma.alertRule.findMany({
        where: { enabled: true },
      })

      for (const rule of alertRules) {
        await this.checkRule(rule)
      }
    } catch (error) {
      logger.error("Error checking alerts:", error)
    }
  }

  private async checkRule(rule: any) {
    try {
      // Get latest metrics for this rule type
      const recentMetrics = await this.prisma.metric.findMany({
        where: {
          type: rule.metricType,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
        include: { server: true },
        orderBy: { timestamp: "desc" },
      })

      for (const metric of recentMetrics) {
        const shouldAlert = this.evaluateCondition(metric.value, rule.condition, rule.threshold)

        if (shouldAlert) {
          await this.createAlert(metric, rule)
        }
      }
    } catch (error) {
      logger.error(`Error checking rule ${rule.id}:`, error)
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case "greater_than":
        return value > threshold
      case "less_than":
        return value < threshold
      case "equals":
        return value === threshold
      default:
        return false
    }
  }

  private async createAlert(metric: any, rule: any) {
    try {
      // Check if there's already an active alert for this server and type
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          serverId: metric.serverId,
          type: this.getAlertType(rule.metricType) as AlertType,
          status: "ACTIVE",
        },
      })

      if (existingAlert) {
        // Update existing alert with new values
        await this.prisma.alert.update({
          where: { id: existingAlert.id },
          data: {
            currentValue: metric.value,
            message: this.generateAlertMessage(rule, metric),
          },
        })
      } else {
        // Create new alert
        const newAlert = await this.prisma.alert.create({
          data: {
            serverId: metric.serverId,
            type: this.getAlertType(rule.metricType) as AlertType,
            severity: rule.severity,
            message: this.generateAlertMessage(rule, metric),
            threshold: rule.threshold,
            currentValue: metric.value,
          },
        })

        // Step 1: Publish the ALERT_TRIGGERED event
        this.eventBus.publish(EventTypes.ALERT_TRIGGERED, {
          alertId: newAlert.id,
          serverId: metric.serverId,
          type: newAlert.type,
          severity: newAlert.severity,
          message: newAlert.message,
        })
        
        logger.warn("Alert created and event published:", {
          server: metric.server.name,
          type: rule.metricType,
          value: metric.value,
          threshold: rule.threshold,
        })
      }
    } catch (error) {
      logger.error("Error creating alert:", error)
    }
  }

  private getAlertType(metricType: string): string {
    const mapping: { [key: string]: string } = {
      CPU_USAGE: "HIGH_CPU",
      MEMORY_USAGE: "HIGH_MEMORY",
      DISK_USAGE: "HIGH_DISK",
      LOAD_AVERAGE: "HIGH_LOAD",
    }
    return mapping[metricType] || "CUSTOM"
  }

  private generateAlertMessage(rule: any, metric: any): string {
    return `${rule.name}: ${metric.server.name} ${rule.metricType.toLowerCase().replace("_", " ")} is ${metric.value.toFixed(2)}${metric.unit}, exceeding threshold of ${rule.threshold}${metric.unit}`
  }
}