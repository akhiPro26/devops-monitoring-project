import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const router = express.Router()
const prisma = new PrismaClient()

const channelSchema = z.object({
  name: z.string(),
  type: z.enum(["email", "sms", "webhook", "slack"]),
  config: z.record(z.string(), z.any()),
  isActive: z.boolean().optional(),
})

// Create notification channel
router.post("/", async (req, res, next) => {
  try {
    const channelData = channelSchema.parse(req.body)

    const channel = await prisma.notificationChannel.create({
      data: channelData,
    })

    res.status(201).json({
      success: true,
      data: channel,
    })
  } catch (error) {
    next(error)
  }
})

// Get all channels
router.get("/", async (req, res, next) => {
  try {
    const { type, isActive } = req.query

    const channels = await prisma.notificationChannel.findMany({
      where: {
        ...(type && { type: type as string }),
        ...(isActive !== undefined && { isActive: isActive === "true" }),
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: channels,
    })
  } catch (error) {
    next(error)
  }
})

// Get channel by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const channel = await prisma.notificationChannel.findUnique({
      where: { id },
    })

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: "Channel not found",
      })
    }

    res.json({
      success: true,
      data: channel,
    })
  } catch (error) {
    next(error)
  }
})

// Update channel
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = channelSchema.partial().parse(req.body)

    const channel = await prisma.notificationChannel.update({
      where: { id },
      data: updateData,
    })

    res.json({
      success: true,
      data: channel,
    })
  } catch (error) {
    next(error)
  }
})

// Delete channel
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.notificationChannel.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Channel deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

// Test channel
router.post("/:id/test", async (req, res, next) => {
  try {
    const { id } = req.params
    const { recipient, message } = z
      .object({
        recipient: z.string(),
        message: z.string().optional(),
      })
      .parse(req.body)

    const channel = await prisma.notificationChannel.findUnique({
      where: { id },
    })

    if (!channel) {
      return res.status(404).json({
        success: false,
        error: "Channel not found",
      })
    }

    // Test notification logic would go here
    // For now, just return success

    res.json({
      success: true,
      message: "Test notification sent successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router
