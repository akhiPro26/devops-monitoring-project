import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { logger } from "./utils/logger"
import { errorHandler } from "./middleware/errorHandler"
import ragRoutes from "./routes/rag"
import predictionsRoutes from "./routes/predictions"
import recommendationsRoutes from "./routes/recommendations"
import chatRoutes from "./routes/chat"
import { startBackgroundJobs } from "./service/backgroundJobs"
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import { RequestHandler } from "express";

dotenv.config()
const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3003
// @ts-ignore
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/rag", ragRoutes)
app.use("/api/predictions", predictionsRoutes)
app.use("/api/recommendations", recommendationsRoutes)
app.use("/api/chat", chatRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ai-service",
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.use(errorHandler)

// Start server
app.listen(PORT, async () => {
  logger.info(`AI Service running on port ${PORT}`)

  try {
    await prisma.$connect()
    logger.info("Connected to database")

    // Start background jobs
    startBackgroundJobs()
    logger.info("Background jobs started")
  } catch (error) {
    logger.error("Failed to connect to database:", error)
    process.exit(1)
  }
})

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down AI Service...")
  await prisma.$disconnect()
  process.exit(0)
})
