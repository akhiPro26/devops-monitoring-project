import Bull from "bull"

// Create the queue instance
const notificationQueue = new Bull("notification processing", process.env.REDIS_URL || "redis://localhost:6379")

export async function addNotificationJob(notificationId: string, delay = 0) {
  await notificationQueue.add(
    { notificationId },
    {
      delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  )
}

export { notificationQueue }