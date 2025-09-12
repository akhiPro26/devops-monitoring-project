import cron from "node-cron"
import { PrismaClient } from "@prisma/client"
import { RecommendationService } from "./recommendationService"
import { PredictionService } from "./predictionService"
import { logger } from "../utils/logger"
import axios from "axios"

const prisma = new PrismaClient()
const recommendationService = new RecommendationService()
const predictionService = new PredictionService()

export function startBackgroundJobs() {
  // Generate recommendations every hour
  cron.schedule("0 * * * *", async () => {
    try {
      logger.info("Starting recommendation generation job")

      // Get all active servers from monitoring service
      const serversResponse = await axios.get("http://monitoring-service:3002/api/servers")
      const servers = serversResponse.data.data

      for (const server of servers) {
        if (server.status === "active") {
          await recommendationService.generateRecommendations(server.id)
        }
      }

      logger.info("Recommendation generation job completed")
    } catch (error) {
      logger.error("Error in recommendation generation job:", error)
    }
  })

  // Generate predictions every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      logger.info("Starting prediction generation job")

      const serversResponse = await axios.get("http://monitoring-service:3002/api/servers")
      const servers = serversResponse.data.data

      const metricTypes = ["cpu", "memory", "disk"]
      const timeframes = ["1h", "1d", "1w"]

      for (const server of servers) {
        if (server.status === "active") {
          for (const metricType of metricTypes) {
            for (const timeframe of timeframes) {
              try {
                await predictionService.generatePrediction({
                  serverId: server.id,
                  metricType,
                  timeframe,
                })
              } catch (error) {
                logger.error(`Error generating prediction for ${server.id}:`, error)
              }
            }
          }
        }
      }

      logger.info("Prediction generation job completed")
    } catch (error) {
      logger.error("Error in prediction generation job:", error)
    }
  })

  // Cleanup old data every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("Starting cleanup job")

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Clean old predictions
      await prisma.prediction.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      })

      // Clean old completed analysis jobs
      await prisma.analysisJob.deleteMany({
        where: {
          status: "completed",
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      })

      logger.info("Cleanup job completed")
    } catch (error) {
      logger.error("Error in cleanup job:", error)
    }
  })
}
