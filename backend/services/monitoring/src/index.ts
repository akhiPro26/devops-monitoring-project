import express from "express"
import cors from "cors"
import helmet from "helmet"
import { PrismaClient } from "@prisma/client"
import { logger } from "./utils/logger"
import { errorHandler } from "./middleware/errorHandler"
import { metricsRouter } from "./routes/metrics"
import { serversRouter } from "./routes/server"
import { alertsRouter } from "./routes/alerts"
import { healthRouter } from "./routes/health"
import { MetricsCollector } from "./service/metricsCollector"
import { AlertManager } from "./service/alertManager"
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

const app = express()
const port = process.env.PORT || 3002
const prisma = new PrismaClient()

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
    logger.info("Metrics collector started")

    // Start alert monitoring
    alertManager.start()
    logger.info("Alert manager started")

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
