import cron from "node-cron"
import { PrismaClient } from "@prisma/client"
import { logger } from "../util/logger"
import { addNotificationJob } from "./queueService"

const prisma = new PrismaClient()

export function startBackgroundJobs() {
  // Retry failed notifications every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      logger.info("Starting failed notification retry job")

      const failedNotifications = await prisma.notification.findMany({
        where: {
          status: "failed",
          retryCount: {
            lt: prisma.notification.fields.maxRetries,
          },
          failedAt: {
            lt: new Date(Date.now() - 15 * 60 * 1000), // Failed more than 15 minutes ago
          },
        },
        take: 100,
      })

      for (const notification of failedNotifications) {
        await addNotificationJob(notification.id, 1000) // 1 second delay
      }

      logger.info(`Queued ${failedNotifications.length} failed notifications for retry`)
    } catch (error) {
      logger.error("Error in failed notification retry job:", error)
    }
  })

  // Clean up old notifications every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      logger.info("Starting notification cleanup job")

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Delete old notification logs
      await prisma.notificationLog.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      })

      // Delete old completed notifications
      await prisma.notification.deleteMany({
        where: {
          status: "sent",
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      })

      logger.info("Notification cleanup job completed")
    } catch (error) {
      logger.error("Error in notification cleanup job:", error)
    }
  })
}
