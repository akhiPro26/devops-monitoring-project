import { PrismaClient } from "@prisma/client"
import axios from "axios"
import { logger } from "../utils/logger"

const prisma = new PrismaClient()

export class PredictionService {
  async generatePrediction(data: {
    serverId: string
    metricType: string
    timeframe: string
    algorithm?: string
  }) {
    try {
      console.log("hello = ", data.serverId);

      const metricsResponse = await axios.get(
        `http://localhost:3002/api/servers/${data.serverId}`,
        {
          params: {
            metricType: data.metricType,
            limit: 100,
          },
          validateStatus: () => true, // prevent axios from throwing on 404
        }
      );

      // Handle case where server is not found
      if (metricsResponse.status === 404 || !metricsResponse.data || !metricsResponse.data.data) {
        return { message: "Server not found" };
      }

      const metrics = metricsResponse.data.data;

      if (!metrics || metrics.length < 10) {
        throw new Error("Insufficient historical data for prediction");
      }

      const prediction = this.performLinearRegression(metrics, data.timeframe);

      const savedPrediction = await prisma.prediction.create({
        data: {
          serverId: data.serverId,
          metricType: data.metricType,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          timeframe: data.timeframe,
          algorithm: data.algorithm || "linear_regression",
          features: {
            historicalDataPoints: metrics.length,
            trend: prediction.trend,
            seasonality: prediction.seasonality,
          },
        },
      });

      return savedPrediction;
    } catch (error) {
      logger.error("Error generating prediction:", error);
      throw error;
    }

  }

  private performLinearRegression(metrics: any[], timeframe: string) {
    const values = metrics.map((m) => m.value)
    const n = values.length

    // Calculate trend
    const x = Array.from({ length: n }, (_, i) => i)
    const y = values

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Predict future value based on timeframe
    const futureX = timeframe === "1h" ? n + 1 : timeframe === "1d" ? n + 24 : timeframe === "1w" ? n + 168 : n + 1

    const predictedValue = slope * futureX + intercept

    // Calculate confidence based on R-squared
    const yMean = sumY / n
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0)
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const rSquared = 1 - ssRes / ssTot

    return {
      value: Math.max(0, predictedValue),
      confidence: Math.max(0.1, Math.min(0.95, rSquared)),
      trend: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable",
      seasonality: "none", // Simplified
    }
  }

  async calculateAccuracy(serverId: string) {
    try {
      const predictions = await prisma.prediction.findMany({
        where: { serverId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })

      // In production, compare with actual values
      const accuracy = {
        totalPredictions: predictions.length,
        averageConfidence: predictions.reduce((sum: any, p: any) => sum + p.confidence, 0) / predictions.length,
        accuracyScore: 0.75, // Placeholder
      }

      return accuracy
    } catch (error) {
      logger.error("Error calculating accuracy:", error)
      throw error
    }
  }
}
