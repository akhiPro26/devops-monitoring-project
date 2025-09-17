import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { logger } from "./util/logger"
import { errorHandler } from "./middleware/errorHandler"
import notificationRoutes from "./routes/notifications"
import channelRoutes from "./routes/channels"
import templateRoutes from "./routes/template"
import subscriptionRoutes from "./routes/subscriptions"
import webhookRoutes from "./routes/webhooks"
import { startBackgroundJobs } from "./service/backgroundJobs"
import { initializeQueues } from "./service/queueService"
import swaggerUi from "swagger-ui-express";


dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3004
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/notifications", notificationRoutes)
app.use("/channels", channelRoutes)
app.use("/templates", templateRoutes)
app.use("/subscriptions", subscriptionRoutes)
app.use("/webhooks", webhookRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "notification-service",
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`)

  try {
    await prisma.$connect()
    logger.info("Connected to database")

    // Initialize queues
    await initializeQueues()
    logger.info("Queues initialized")

    // Start background jobs
    startBackgroundJobs()
    logger.info("Background jobs started")
  } catch (error) {
    logger.error("Failed to start service:", error)
    process.exit(1)
  }
})

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down Notification Service...")
  await prisma.$disconnect()
  process.exit(0)
})
