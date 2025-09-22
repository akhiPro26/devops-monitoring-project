import cron from "node-cron"
import { PrismaClient } from "@prisma/client"
import { logger } from "../util/logger"
import { addNotificationJob } from "./queueService"
import { EventBus, EventTypes } from "../../../../shared/utils/eventBus"

const prisma = new PrismaClient()

export function startBackgroundJobs() {
  const eventBus = EventBus.getInstance("notification-service")

  // Listen for alert events
  eventBus.subscribe(EventTypes.ALERT_TRIGGERED, async (event) => {
    try {
      logger.info("Received ALERT_TRIGGERED event, processing...", { event })

      const { alertId } = event.payload
      const alert = await prisma.alert.findUnique({
        where: { id: alertId },
        include: { server: true },
      })

      if (!alert) {
        logger.warn(`Alert with ID ${alertId} not found, skipping notification.`)
        return
      }

      // Find all subscriptions for this server and alert type
      const subscriptions = await prisma.subscription.findMany({
        where: {
          serverId: alert.serverId,
          alertType: alert.type,
          isActive: true,
        },
      })

      if (subscriptions.length === 0) {
        logger.info(`No active subscriptions found for alert on server ${alert.serverId}`)
        return
      }

      for (const subscription of subscriptions) {
        // Create a notification job for each channel in the subscription
        for (const channel of subscription.channels) {
          const notification = await prisma.notification.create({
            data: {
              type: "ALERT",
              title: `New Alert: ${alert.severity} - ${alert.type}`,
              message: alert.message,
              recipient: subscription.userId,
              channelType: channel,
              priority: alert.severity,
              metadata: {
                serverId: alert.serverId,
                alertId: alert.id,
              },
            },
          })

          await addNotificationJob(notification.id)
        }
      }

      logger.info(`Queued notifications for alert ${alertId}`)
    } catch (error) {
      logger.error("Error processing ALERT_TRIGGERED event:", error)
    }
  })

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