import express from "express"
import cors from "cors"
import helmet from "helmet"
import { PrismaClient } from "@prisma/client"
import { logger } from "./utils/logger"
import { errorHandler } from "./middleware/errorHandler"
import { metricsRouter } from "./routes/metrics"
import { serversRouter } from "./routes/server"
import { alertsRouter } from "./routes/alerts"
import { alertRulesRouter } from "./routes/alertRules"
import { healthRouter } from "./routes/health"
import { MetricsCollector } from "./service/metricsCollector"
import { AlertManager } from "./service/alertManager"
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import { EventBus, EventTypes } from "../../../shared/utils/eventBus"
import {ServiceClient } from "../../../shared/utils/serviceClient"


const app = express()
const port = process.env.PORT || 3002
const prisma = new PrismaClient()
const eventBus = EventBus.getInstance("monitoring-service")
const userService = new ServiceClient("users")

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/metrics", metricsRouter)
app.use("/api/servers", serversRouter)
app.use("/api/alerts", alertsRouter)
app.use("/api/health", healthRouter)
app.use("/api/alert-rules", alertRulesRouter)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "monitoring-service",
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.use(errorHandler)

// Initialize services
const metricsCollector = new MetricsCollector(prisma)
const alertManager = new AlertManager(prisma)

// Start services
async function startServer() {
  try {
    await prisma.$connect()
    logger.info("Connected to database")

    // Start metrics collection
    metricsCollector.start()
    console.log("metrics collector started")
    logger.info("Metrics collector started")

    // Start alert monitoring
    alertManager.start()
    logger.info("Alert manager started")

     // Listen for new servers from the user service
  eventBus.subscribe(EventTypes.SERVER_ADDED, async (data) => {
    logger.info(`Received SERVER_ADDED event for serverId: ${data.payload.serverId}`)
    try {
      // Use the new public method to fetch the server from the user service
      const serverResponse = await userService.getUserServiceServer(data.payload.serverId)

      if (serverResponse.success && serverResponse.data) {
        const server = serverResponse.data
        // Now, you can use the server data to create a new entry
        // in your local metrics, alerts, and healthChecks tables.
        logger.info(`Initialized monitoring for new server: ${server.name}`)
      } else {
        logger.error(`Failed to fetch server details for serverId ${data.payload.serverId}:`, serverResponse.error)
      }
    } catch (error) {
      logger.error(`Failed to fetch server details for serverId ${data.payload.serverId}:`, error)
    }
  })
    app.listen(port, () => {
      logger.info(`Monitoring service running on port ${port}`)
    })

  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down monitoring service...")
  metricsCollector.stop()
  alertManager.stop()
  await prisma.$disconnect()
  process.exit(0)
})

startServer()
