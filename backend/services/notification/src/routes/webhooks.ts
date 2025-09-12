import express from "express"
import { NotificationService } from "../service/notificationService"

const router = express.Router()
const notificationService = new NotificationService()

// Webhook for monitoring alerts
router.post("/alert", async (req, res, next) => {
  try {
    const alertData = req.body

    // Process alert and send notifications
    await notificationService.processAlert(alertData)

    res.json({
      success: true,
      message: "Alert processed successfully",
    })
  } catch (error) {
    next(error)
  }
})

// Webhook for delivery status updates (SendGrid, Twilio, etc.)
router.post("/delivery-status", async (req, res, next) => {
  try {
    const statusData = req.body

    await notificationService.updateDeliveryStatus(statusData)

    res.json({
      success: true,
      message: "Status updated successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router
