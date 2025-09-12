import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { NotificationService } from "../service/notificationService"

const router = express.Router()
const prisma = new PrismaClient()
const notificationService = new NotificationService()

const sendNotificationSchema = z.object({
  type: z.string(),
  title: z.string(),
  message: z.string(),
  recipient: z.string(),
  channelType: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  templateId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

// Send notification
router.post("/send", async (req, res, next) => {
  try {
    const notificationData = sendNotificationSchema.parse(req.body)

    const notification = await notificationService.sendNotification(notificationData)

    res.status(201).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    next(error)
  }
})

// Send bulk notifications
router.post("/send-bulk", async (req, res, next) => {
  try {
    const { notifications } = z
      .object({
        notifications: z.array(sendNotificationSchema),
      })
      .parse(req.body)

    const results = await notificationService.sendBulkNotifications(notifications)

    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    next(error)
  }
})

// Get notifications
router.get("/", async (req, res, next) => {
  try {
    const { status, type, recipient, limit = "20", offset = "0" } = req.query

    const notifications = await prisma.notification.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(type && { type: type as string }),
        ...(recipient && { recipient: recipient as string }),
      },
      include: {
        template: true,
        channel: true,
      },
      take: Number.parseInt(limit as string),
      skip: Number.parseInt(offset as string),
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    next(error)
  }
})

// Get notification by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        template: true,
        channel: true,
      },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      })
    }

    res.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    next(error)
  }
})

// Retry failed notification
router.post("/:id/retry", async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await notificationService.retryNotification(id)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

// Get notification statistics
router.get("/stats/overview", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    const stats = await notificationService.getNotificationStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    next(error)
  }
})

export default router
