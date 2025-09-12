import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { RecommendationService } from "../service/recommendationService"

const router = express.Router()
const prisma = new PrismaClient()
const recommendationService = new RecommendationService()

/**
 * @swagger
 * components:
 *   schemas:
 *     Recommendation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the recommendation
 *           example: "rec123abc456def789"
 *         serverId:
 *           type: string
 *           description: ID of the server this recommendation applies to
 *           example: "server123"
 *         type:
 *           type: string
 *           description: Type of recommendation
 *           enum: [performance, maintenance, security, monitoring, configuration]
 *           example: "performance"
 *         title:
 *           type: string
 *           description: Brief title of the recommendation
 *           example: "High CPU Usage Detected"
 *         description:
 *           type: string
 *           description: Detailed description of the issue and suggested action
 *           example: "Average CPU usage is 85.3%. Consider scaling up or optimizing processes."
 *         priority:
 *           type: string
 *           description: Priority level of the recommendation
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         category:
 *           type: string
 *           description: Category of the recommendation
 *           enum: [performance, storage, security, monitoring, network, configuration]
 *           example: "performance"
 *         status:
 *           type: string
 *           description: Current status of the recommendation
 *           enum: [pending, acknowledged, in_progress, resolved, dismissed]
 *           example: "pending"
 *           default: "pending"
 *         confidence:
 *           type: number
 *           description: Confidence score of the recommendation (0-1)
 *           minimum: 0
 *           maximum: 1
 *           example: 0.9
 *         impact:
 *           type: string
 *           description: Expected impact level
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         effort:
 *           type: string
 *           description: Expected effort to implement
 *           enum: [low, medium, high]
 *           example: "medium"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 * 
 *     RecommendationsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Recommendation'
 * 
 *     RecommendationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Recommendation'
 * 
 *     StatusUpdateRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: New status for the recommendation
 *           enum: [pending, acknowledged, in_progress, resolved, dismissed]
 *           example: "acknowledged"
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Server not found or insufficient data"
 */

/**
 * @swagger
 * /api/recommendations/generate/{serverId}:
 *   post:
 *     summary: Generate recommendations for a server
 *     description: Analyze server metrics and alerts to generate intelligent recommendations for performance optimization, maintenance, and issue resolution
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to generate recommendations for
 *         schema:
 *           type: string
 *           example: "server123"
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationsResponse'
 *             examples:
 *               multiple_recommendations:
 *                 summary: Server with multiple recommendations
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "rec123abc456def789"
 *                       serverId: "server123"
 *                       type: "performance"
 *                       title: "High CPU Usage Detected"
 *                       description: "Average CPU usage is 85.3%. Consider scaling up or optimizing processes."
 *                       priority: "high"
 *                       category: "performance"
 *                       status: "pending"
 *                       confidence: 0.9
 *                       impact: "high"
 *                       effort: "medium"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     - id: "rec456def789abc123"
 *                       serverId: "server123"
 *                       type: "maintenance"
 *                       title: "Disk Space Warning"
 *                       description: "Disk usage is at 78.5%. Plan for cleanup or expansion."
 *                       priority: "medium"
 *                       category: "storage"
 *                       status: "pending"
 *                       confidence: 0.8
 *                       impact: "medium"
 *                       effort: "low"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *               critical_recommendations:
 *                 summary: Server with critical issues
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "rec789ghi012jkl345"
 *                       serverId: "server123"
 *                       type: "maintenance"
 *                       title: "Disk Space Critical"
 *                       description: "Disk usage is at 92.1%. Immediate cleanup or expansion required."
 *                       priority: "critical"
 *                       category: "storage"
 *                       status: "pending"
 *                       confidence: 0.95
 *                       impact: "critical"
 *                       effort: "low"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *               no_recommendations:
 *                 summary: Healthy server with no recommendations
 *                 value:
 *                   success: true
 *                   data: []
 *       404:
 *         description: Server not found or insufficient metrics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_not_found:
 *                 summary: Server not found
 *                 value:
 *                   success: false
 *                   error: "Server not found or insufficient data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/generate/:serverId", async (req, res, next) => {
  try {
    const { serverId } = req.params

    const recommendations = await recommendationService.generateRecommendations(serverId)

    res.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get recommendations with filtering options
 *     description: Retrieve recommendations with optional filtering by server, status, priority, and category
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: serverId
 *         description: Filter by specific server ID
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: query
 *         name: status
 *         description: Filter by recommendation status
 *         schema:
 *           type: string
 *           enum: [pending, acknowledged, in_progress, resolved, dismissed]
 *           example: "pending"
 *       - in: query
 *         name: priority
 *         description: Filter by priority level
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *       - in: query
 *         name: category
 *         description: Filter by recommendation category
 *         schema:
 *           type: string
 *           enum: [performance, storage, security, monitoring, network, configuration]
 *           example: "performance"
 *       - in: query
 *         name: limit
 *         description: Maximum number of recommendations to return
 *         schema:
 *           type: string
 *           default: "20"
 *           example: "10"
 *       - in: query
 *         name: offset
 *         description: Number of recommendations to skip (for pagination)
 *         schema:
 *           type: string
 *           default: "0"
 *           example: "20"
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationsResponse'
 *             examples:
 *               all_recommendations:
 *                 summary: All recommendations across servers
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "rec123abc456def789"
 *                       serverId: "server123"
 *                       type: "performance"
 *                       title: "High CPU Usage Detected"
 *                       description: "Average CPU usage is 85.3%. Consider scaling up or optimizing processes."
 *                       priority: "high"
 *                       category: "performance"
 *                       status: "pending"
 *                       confidence: 0.9
 *                       impact: "high"
 *                       effort: "medium"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                     - id: "rec456def789abc123"
 *                       serverId: "server456"
 *                       type: "monitoring"
 *                       title: "High Alert Volume"
 *                       description: "8 active alerts detected. Review alert thresholds and investigate root causes."
 *                       priority: "medium"
 *                       category: "monitoring"
 *                       status: "acknowledged"
 *                       confidence: 0.7
 *                       impact: "medium"
 *                       effort: "medium"
 *                       createdAt: "2024-01-15T09:15:00Z"
 *                       updatedAt: "2024-01-15T11:00:00Z"
 *               filtered_recommendations:
 *                 summary: High priority recommendations only
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "rec789ghi012jkl345"
 *                       serverId: "server789"
 *                       type: "maintenance"
 *                       title: "Disk Space Critical"
 *                       description: "Disk usage is at 92.1%. Immediate cleanup or expansion required."
 *                       priority: "critical"
 *                       category: "storage"
 *                       status: "pending"
 *                       confidence: 0.95
 *                       impact: "critical"
 *                       effort: "low"
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *               empty_results:
 *                 summary: No recommendations match filters
 *                 value:
 *                   success: true
 *                   data: []
 *       400:
 *         description: Bad request - invalid filter parameters
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
router.get("/", async (req, res, next) => {
  try {
    const { serverId, status, priority, category, limit = "20", offset = "0" } = req.query

    const recommendations = await prisma.recommendation.findMany({
      where: {
        ...(serverId && { serverId: serverId as string }),
        ...(status && { status: status as string }),
        ...(priority && { priority: priority as string }),
        ...(category && { category: category as string }),
      },
      take: Number.parseInt(limit as string),
      skip: Number.parseInt(offset as string),
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    })

    res.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/recommendations/{id}/status:
 *   patch:
 *     summary: Update recommendation status
 *     description: Update the status of a specific recommendation (e.g., acknowledge, mark as in progress, resolve, or dismiss)
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the recommendation to update
 *         schema:
 *           type: string
 *           example: "rec123abc456def789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdateRequest'
 *           examples:
 *             acknowledge:
 *               summary: Acknowledge recommendation
 *               value:
 *                 status: "acknowledged"
 *             in_progress:
 *               summary: Mark as in progress
 *               value:
 *                 status: "in_progress"
 *             resolve:
 *               summary: Mark as resolved
 *               value:
 *                 status: "resolved"
 *             dismiss:
 *               summary: Dismiss recommendation
 *               value:
 *                 status: "dismissed"
 *     responses:
 *       200:
 *         description: Recommendation status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecommendationResponse'
 *             examples:
 *               acknowledged:
 *                 summary: Recommendation acknowledged
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "rec123abc456def789"
 *                     serverId: "server123"
 *                     type: "performance"
 *                     title: "High CPU Usage Detected"
 *                     description: "Average CPU usage is 85.3%. Consider scaling up or optimizing processes."
 *                     priority: "high"
 *                     category: "performance"
 *                     status: "acknowledged"
 *                     confidence: 0.9
 *                     impact: "high"
 *                     effort: "medium"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T12:15:00Z"
 *               resolved:
 *                 summary: Recommendation resolved
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "rec123abc456def789"
 *                     serverId: "server123"
 *                     type: "performance"
 *                     title: "High CPU Usage Detected"
 *                     description: "Average CPU usage is 85.3%. Consider scaling up or optimizing processes."
 *                     priority: "high"
 *                     category: "performance"
 *                     status: "resolved"
 *                     confidence: 0.9
 *                     impact: "high"
 *                     effort: "medium"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T14:30:00Z"
 *       400:
 *         description: Bad request - invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_status:
 *                 summary: Invalid status value
 *                 value:
 *                   success: false
 *                   error: "Invalid status value. Must be one of: pending, acknowledged, in_progress, resolved, dismissed"
 *       404:
 *         description: Recommendation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Recommendation not found
 *                 value:
 *                   success: false
 *                   error: "Recommendation not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = z.object({ status: z.string() }).parse(req.body)

    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })

    res.json({
      success: true,
      data: recommendation,
    })
  } catch (error) {
    next(error)
  }
})

export default router