import { NotificationService } from "./notificationService"
import { notificationQueue } from "./queueOperations"
import { logger } from "../util/logger"

const notificationService = new NotificationService()

export async function initializeQueues() {
  notificationQueue.process(async (job) => {
    const { notificationId } = job.data
    await notificationService.processNotification(notificationId)
  })

  notificationQueue.on("completed", (job) => {
    logger.info(`Notification job ${job.id} completed`)
  })

  notificationQueue.on("failed", (job, err) => {
    logger.error(`Notification job ${job.id} failed:`, err)
  })
}

// Re-export for convenience
export { addNotificationJob } from "./queueOperations"