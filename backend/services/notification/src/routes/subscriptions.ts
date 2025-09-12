import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const router = express.Router()
const prisma = new PrismaClient()

const subscriptionSchema = z.object({
  userId: z.string(),
  serverId: z.string().optional(),
  alertType: z.string().optional(),
  channels: z.array(z.string()),
  isActive: z.boolean().optional(),
})

// Create subscription
router.post("/", async (req, res, next) => {
  try {
    const subscriptionData = subscriptionSchema.parse(req.body)

    const subscription = await prisma.subscription.create({
      data: subscriptionData,
    })

    res.status(201).json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    next(error)
  }
})

// Get user subscriptions
router.get("/user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: subscriptions,
    })
  } catch (error) {
    next(error)
  }
})

// Update subscription
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = subscriptionSchema.partial().parse(req.body)

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
    })

    res.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    next(error)
  }
})

// Delete subscription
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.subscription.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Subscription deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router
