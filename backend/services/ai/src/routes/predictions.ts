import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { PredictionService } from "../service/predictionService"

const router = express.Router()
const prisma = new PrismaClient()
const predictionService = new PredictionService()

const predictionRequestSchema = z.object({
  serverId: z.string(),
  metricType: z.string(),
  timeframe: z.string(),
  algorithm: z.string().optional(),
})

/**
 * @swagger
 * components:
 *   schemas:
 *     PredictionRequest:
 *       type: object
 *       required:
 *         - serverId
 *         - metricType
 *         - timeframe
 *       properties:
 *         serverId:
 *           type: string
 *           description: ID of the server to generate predictions for
 *           example: "server123"
 *         metricType:
 *           type: string
 *           description: Type of metric to predict
 *           enum: [cpu_usage, memory_usage, disk_usage, network_io, response_time, throughput]
 *           example: "cpu_usage"
 *         timeframe:
 *           type: string
 *           description: Time horizon for the prediction
 *           enum: [1h, 1d, 1w, 1m]
 *           example: "1h"
 *         algorithm:
 *           type: string
 *           description: Optional prediction algorithm to use
 *           enum: [linear_regression, arima, neural_network, random_forest]
 *           example: "linear_regression"
 * 
 *     Prediction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "pred123abc456def789"
 *         serverId:
 *           type: string
 *           example: "server123"
 *         metricType:
 *           type: string
 *           example: "cpu_usage"
 *         predictedValue:
 *           type: number
 *           description: The predicted metric value
 *           example: 75.5
 *         confidence:
 *           type: number
 *           description: Confidence score of the prediction (0-1)
 *           minimum: 0
 *           maximum: 1
 *           example: 0.85
 *         timeframe:
 *           type: string
 *           example: "1h"
 *         algorithm:
 *           type: string
 *           example: "linear_regression"
 *         features:
 *           type: object
 *           description: Additional prediction features and metadata
 *           properties:
 *             historicalDataPoints:
 *               type: number
 *               example: 100
 *             trend:
 *               type: string
 *               enum: [increasing, decreasing, stable]
 *               example: "increasing"
 *             seasonality:
 *               type: string
 *               example: "none"
 *           additionalProperties: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 * 
 *     PredictionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Prediction'
 * 
 *     PredictionsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Prediction'
 * 
 *     AccuracyMetrics:
 *       type: object
 *       properties:
 *         totalPredictions:
 *           type: number
 *           description: Total number of predictions made for this server
 *           example: 25
 *         averageConfidence:
 *           type: number
 *           description: Average confidence score across all predictions
 *           minimum: 0
 *           maximum: 1
 *           example: 0.82
 *         accuracyScore:
 *           type: number
 *           description: Overall accuracy score based on actual vs predicted values
 *           minimum: 0
 *           maximum: 1
 *           example: 0.75
 * 
 *     AccuracyResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AccuracyMetrics'
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Insufficient historical data for prediction"
 */

/**
 * @swagger
 * /api/predictions/generate:
 *   post:
 *     summary: Generate prediction for server metrics
 *     description: Generate a predictive analysis for specified server metrics using machine learning algorithms
 *     tags: [Predictions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PredictionRequest'
 *           examples:
 *             cpu_prediction:
 *               summary: CPU usage prediction
 *               value:
 *                 serverId: "server123"
 *                 metricType: "cpu_usage"
 *                 timeframe: "1h"
 *                 algorithm: "linear_regression"
 *             memory_prediction:
 *               summary: Memory usage prediction
 *               value:
 *                 serverId: "server456"
 *                 metricType: "memory_usage"
 *                 timeframe: "1d"
 *             disk_prediction:
 *               summary: Disk usage prediction (default algorithm)
 *               value:
 *                 serverId: "server789"
 *                 metricType: "disk_usage"
 *                 timeframe: "1w"
 *     responses:
 *       200:
 *         description: Prediction generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionResponse'
 *             examples:
 *               success:
 *                 summary: Successful prediction generation
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "pred123abc456def789"
 *                     serverId: "server123"
 *                     metricType: "cpu_usage"
 *                     predictedValue: 75.5
 *                     confidence: 0.85
 *                     timeframe: "1h"
 *                     algorithm: "linear_regression"
 *                     features:
 *                       historicalDataPoints: 100
 *                       trend: "increasing"
 *                       seasonality: "none"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficient_data:
 *                 summary: Insufficient historical data
 *                 value:
 *                   success: false
 *                   error: "Insufficient historical data for prediction"
 *               invalid_metric:
 *                 summary: Invalid metric type
 *                 value:
 *                   success: false
 *                   error: "Invalid metric type specified"
 *       404:
 *         description: Server not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/generate", async (req, res, next) => {
  try {
    const requestData = predictionRequestSchema.parse(req.body)

    const prediction = await predictionService.generatePrediction(requestData)

    res.json({
      success: true,
      data: prediction,
    })
  } catch (error) {
    // console.log("ERROR = ", error.message)
    next(error)
  }
})

/**
 * @swagger
 * /api/predictions/server/{serverId}:
 *   get:
 *     summary: Get predictions for a specific server
 *     description: Retrieve historical predictions for a server with optional filtering by metric type
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get predictions for
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: query
 *         name: metricType
 *         description: Optional filter by metric type
 *         schema:
 *           type: string
 *           enum: [cpu_usage, memory_usage, disk_usage, network_io, response_time, throughput]
 *           example: "cpu_usage"
 *       - in: query
 *         name: limit
 *         description: Maximum number of predictions to return
 *         schema:
 *           type: string
 *           default: "10"
 *           example: "20"
 *     responses:
 *       200:
 *         description: Predictions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PredictionsListResponse'
 *             examples:
 *               all_predictions:
 *                 summary: All predictions for server
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "pred123abc456def789"
 *                       serverId: "server123"
 *                       metricType: "cpu_usage"
 *                       predictedValue: 75.5
 *                       confidence: 0.85
 *                       timeframe: "1h"
 *                       algorithm: "linear_regression"
 *                       features:
 *                         historicalDataPoints: 100
 *                         trend: "increasing"
 *                         seasonality: "none"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     - id: "pred456def789abc123"
 *                       serverId: "server123"
 *                       metricType: "memory_usage"
 *                       predictedValue: 68.2
 *                       confidence: 0.78
 *                       timeframe: "1d"
 *                       algorithm: "linear_regression"
 *                       features:
 *                         historicalDataPoints: 96
 *                         trend: "stable"
 *                         seasonality: "none"
 *                       createdAt: "2024-01-15T09:15:00Z"
 *                       updatedAt: "2024-01-15T09:15:00Z"
 *               filtered_predictions:
 *                 summary: CPU predictions only
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "pred123abc456def789"
 *                       serverId: "server123"
 *                       metricType: "cpu_usage"
 *                       predictedValue: 75.5
 *                       confidence: 0.85
 *                       timeframe: "1h"
 *                       algorithm: "linear_regression"
 *                       features:
 *                         historicalDataPoints: 100
 *                         trend: "increasing"
 *                         seasonality: "none"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Server not found or no predictions available
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/server/:serverId", async (req, res, next) => {
  try {
    const { serverId } = req.params
    const { metricType, limit = "10" } = req.query

    const predictions = await prisma.prediction.findMany({
      where: {
        serverId,
        ...(metricType && { metricType: metricType as string }),
      },
      take: Number.parseInt(limit as string),
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: predictions,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/predictions/accuracy/{serverId}:
 *   get:
 *     summary: Get prediction accuracy metrics for a server
 *     description: Retrieve accuracy statistics and performance metrics for predictions made for a specific server
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get accuracy metrics for
 *         schema:
 *           type: string
 *           example: "server123"
 *     responses:
 *       200:
 *         description: Accuracy metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccuracyResponse'
 *             examples:
 *               good_accuracy:
 *                 summary: Server with good prediction accuracy
 *                 value:
 *                   success: true
 *                   data:
 *                     totalPredictions: 45
 *                     averageConfidence: 0.82
 *                     accuracyScore: 0.78
 *               poor_accuracy:
 *                 summary: Server with lower prediction accuracy
 *                 value:
 *                   success: true
 *                   data:
 *                     totalPredictions: 12
 *                     averageConfidence: 0.65
 *                     accuracyScore: 0.58
 *               no_predictions:
 *                 summary: Server with no prediction history
 *                 value:
 *                   success: true
 *                   data:
 *                     totalPredictions: 0
 *                     averageConfidence: 0
 *                     accuracyScore: 0
 *       404:
 *         description: Server not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_not_found:
 *                 summary: Server not found
 *                 value:
 *                   success: false
 *                   error: "Server not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/accuracy/:serverId", async (req, res, next) => {
  try {
    const { serverId } = req.params

    const accuracy = await predictionService.calculateAccuracy(serverId)

    res.json({
      success: true,
      data: accuracy,
    })
  } catch (error) {
    next(error)
  }
})

export default router