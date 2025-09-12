import { PrismaClient } from "@prisma/client"
import { EmailProvider } from "./provider/emailProvider"
import { SMSProvider } from "./provider/smsProvider"
import { WebhookProvider } from "./provider/webhookProvider"
import { TemplateEngine } from "./templateEngine"
import { logger } from "../util/logger"
import { addNotificationJob } from "./queueOperations"

const prisma = new PrismaClient()

export class NotificationService {
  private emailProvider = new EmailProvider()
  private smsProvider = new SMSProvider()
  private webhookProvider = new WebhookProvider()
  private templateEngine = new TemplateEngine()

  async sendNotification(data: {
    type: string
    title: string
    message: string
    recipient: string
    channelType: string
    priority?: string
    templateId?: string
    metadata?: Record<string, any>
  }) {
    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          recipient: data.recipient,
          channelType: data.channelType,
          priority: data.priority || "medium",
          templateId: data.templateId,
          metadata: data.metadata || {},
        },
      })

      // Add to queue for processing
      await addNotificationJob(notification.id)

      return notification
    } catch (error) {
      logger.error("Error creating notification:", error)
      throw error
    }
  }

  async sendBulkNotifications(notifications: any[]) {
    const results = []

    for (const notificationData of notifications) {
      try {
        const notification = await this.sendNotification(notificationData)
        results.push({ success: true, id: notification.id })
      } catch (error:any) {
        results.push({ success: false, error: error.message })
      }
    }

    return results
  }

  async processNotification(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          template: true,
          channel: true,
        },
      })

      if (!notification) {
        throw new Error("Notification not found")
      }

      let content = notification.message
      let subject = notification.title

      // Apply template if specified
      if (notification.template) {
        const templateData = {
          title: notification.title,
          message: notification.message,
          ...notification.metadata,
        }

        content = this.templateEngine.render(notification.template.body, templateData)
        if (notification.template.subject) {
          subject = this.templateEngine.render(notification.template.subject, templateData)
        }
      }

      // Send via appropriate channel
      let result
      switch (notification.channelType) {
        case "email":
          result = await this.emailProvider.send({
            to: notification.recipient,
            subject,
            content,
            metadata: typeof notification.metadata === "object" && notification.metadata !== null ? notification.metadata : {},
          })
          break
        case "sms":
          result = await this.smsProvider.send({
            to: notification.recipient,
            message: content,
            metadata: typeof notification.metadata === "object" && notification.metadata !== null ? notification.metadata : {},

          })
          break
        case "webhook":
          result = await this.webhookProvider.send({
            url: notification.recipient,
            payload: {
              title: subject,
              message: content,
              metadata: notification.metadata,
            },
          })
          break
        default:
          throw new Error(`Unsupported channel type: ${notification.channelType}`)
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: result.success ? "sent" : "failed",
          sentAt: result.success ? new Date() : null,
          error: result.success ? null : ((result as any).error ?? "Unknown error"),
          updatedAt: new Date(),
        },
      })

      // Log the event
      await prisma.notificationLog.create({
        data: {
          notificationId,
          event: result.success ? "sent" : "failed",
          details: result,
        },
      })

      return result
    } catch (error) {
      logger.error("Error processing notification:", error)

      // Update notification as failed
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      throw error
    }
  }

  async retryNotification(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        throw new Error("Notification not found")
      }

      if (notification.retryCount >= notification.maxRetries) {
        throw new Error("Maximum retry attempts exceeded")
      }

      // Increment retry count
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          retryCount: notification.retryCount + 1,
          status: "pending",
          error: null,
          updatedAt: new Date(),
        },
      })

      // Add back to queue
      await addNotificationJob(notificationId)

      return { success: true, message: "Notification queued for retry" }
    } catch (error) {
      logger.error("Error retrying notification:", error)
      throw error
    }
  }

  async processAlert(alertData: any) {
    try {
      // Find subscriptions for this alert
      const subscriptions = await prisma.subscription.findMany({
        where: {
          isActive: true,
          OR: [
            { serverId: alertData.serverId },
            { alertType: alertData.type },
            { serverId: null, alertType: null }, // Global subscriptions
          ],
        },
      })

      // Send notifications to subscribers
      for (const subscription of subscriptions) {
        for (const channelType of subscription.channels) {
          await this.sendNotification({
            type: "alert",
            title: `Alert: ${alertData.title}`,
            message: alertData.message,
            recipient: subscription.userId, // This should be resolved to actual contact info
            channelType,
            priority: alertData.priority || "medium",
            metadata: {
              alertId: alertData.id,
              serverId: alertData.serverId,
              alertType: alertData.type,
            },
          })
        }
      }
    } catch (error) {
      logger.error("Error processing alert:", error)
      throw error
    }
  }

  async updateDeliveryStatus(statusData: any) {
    try {
      // Update notification status based on webhook data
      // Implementation depends on provider format
      logger.info("Delivery status update received:", statusData)
    } catch (error) {
      logger.error("Error updating delivery status:", error)
      throw error
    }
  }

  async getNotificationStats(options: { startDate?: Date; endDate?: Date }) {
    try {
      const whereClause = {
        ...(options.startDate && { createdAt: { gte: options.startDate } }),
        ...(options.endDate && { createdAt: { lte: options.endDate } }),
      }

      const [total, sent, failed, pending] = await Promise.all([
        prisma.notification.count({ where: whereClause }),
        prisma.notification.count({ where: { ...whereClause, status: "sent" } }),
        prisma.notification.count({ where: { ...whereClause, status: "failed" } }),
        prisma.notification.count({ where: { ...whereClause, status: "pending" } }),
      ])

      const deliveryRate = total > 0 ? (sent / total) * 100 : 0

      return {
        total,
        sent,
        failed,
        pending,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      }
    } catch (error) {
      logger.error("Error getting notification stats:", error)
      throw error
    }
  }
}
