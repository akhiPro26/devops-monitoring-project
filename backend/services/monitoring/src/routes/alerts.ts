import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "../utils/logger"

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const alertsQuerySchema = z.object({
  serverId: z.string().optional(),
  status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
})

const updateAlertSchema = z.object({
  status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]),
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the alert
 *           example: "alert123abc456def789"
 *         serverId:
 *           type: string
 *           description: ID of the server that triggered the alert
 *           example: "server123"
 *         title:
 *           type: string
 *           description: Brief title of the alert
 *           example: "High CPU Usage"
 *         description:
 *           type: string
 *           description: Detailed description of the alert condition
 *           example: "CPU usage has exceeded 85% for the last 5 minutes"
 *         severity:
 *           type: string
 *           description: Severity level of the alert
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           example: "HIGH"
 *         status:
 *           type: string
 *           description: Current status of the alert
 *           enum: [ACTIVE, RESOLVED, ACKNOWLEDGED]
 *           example: "ACTIVE"
 *         metricType:
 *           type: string
 *           description: Type of metric that triggered the alert
 *           example: "cpu_usage"
 *         threshold:
 *           type: number
 *           description: Threshold value that was exceeded
 *           example: 85
 *         actualValue:
 *           type: number
 *           description: Actual metric value when alert was triggered
 *           example: 92.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the alert was first created
 *           example: "2024-01-15T10:30:00Z"
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the alert was resolved (null if not resolved)
 *           example: "2024-01-15T11:00:00Z"
 *         server:
 *           type: object
 *           description: Basic server information
 *           properties:
 *             id:
 *               type: string
 *               example: "server123"
 *             name:
 *               type: string
 *               example: "Web Server 01"
 *             hostname:
 *               type: string
 *               example: "web01.example.com"
 * 
 *     AlertSummary:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of active alerts
 *           example: 15
 *         critical:
 *           type: integer
 *           description: Number of critical alerts
 *           example: 2
 *         high:
 *           type: integer
 *           description: Number of high severity alerts
 *           example: 5
 *         medium:
 *           type: integer
 *           description: Number of medium severity alerts
 *           example: 6
 *         low:
 *           type: integer
 *           description: Number of low severity alerts
 *           example: 2
 * 
 *     AlertUpdateRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: New status for the alert
 *           enum: [ACTIVE, RESOLVED, ACKNOWLEDGED]
 *           example: "ACKNOWLEDGED"
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid query parameters"
 *         details:
 *           type: array
 *           description: Detailed validation errors (when applicable)
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               expected:
 *                 type: string
 *               received:
 *                 type: string
 *               path:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 */

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get alerts with filtering options
 *     description: Retrieve alerts with optional filtering by server, status, severity, and pagination
 *     tags: [Alerts]
 *     parameters:
 *       - in: query
 *         name: serverId
 *         description: Filter alerts by specific server ID
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: query
 *         name: status
 *         description: Filter alerts by status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RESOLVED, ACKNOWLEDGED]
 *           example: "ACTIVE"
 *       - in: query
 *         name: severity
 *         description: Filter alerts by severity level
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           example: "HIGH"
 *       - in: query
 *         name: limit
 *         description: Maximum number of alerts to return (1-100)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *           example: 20
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Alert'
 *             examples:
 *               multiple_alerts:
 *                 summary: Multiple alerts with different severities
 *                 value:
 *                   - id: "alert123abc456def789"
 *                     serverId: "server123"
 *                     title: "High CPU Usage"
 *                     description: "CPU usage has exceeded 85% for the last 5 minutes"
 *                     severity: "HIGH"
 *                     status: "ACTIVE"
 *                     metricType: "cpu_usage"
 *                     threshold: 85
 *                     actualValue: 92.5
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     resolvedAt: null
 *                     server:
 *                       id: "server123"
 *                       name: "Web Server 01"
 *                       hostname: "web01.example.com"
 *                   - id: "alert456def789abc123"
 *                     serverId: "server456"
 *                     title: "Disk Space Critical"
 *                     description: "Disk usage has exceeded 90% on /var partition"
 *                     severity: "CRITICAL"
 *                     status: "ACKNOWLEDGED"
 *                     metricType: "disk_usage"
 *                     threshold: 90
 *                     actualValue: 95.8
 *                     createdAt: "2024-01-15T09:15:00Z"
 *                     resolvedAt: null
 *                     server:
 *                       id: "server456"
 *                       name: "Database Server"
 *                       hostname: "db01.example.com"
 *               filtered_alerts:
 *                 summary: Filtered alerts (CRITICAL severity only)
 *                 value:
 *                   - id: "alert789ghi012jkl345"
 *                     serverId: "server789"
 *                     title: "Service Down"
 *                     description: "Nginx service is not responding"
 *                     severity: "CRITICAL"
 *                     status: "ACTIVE"
 *                     metricType: "service_status"
 *                     threshold: 1
 *                     actualValue: 0
 *                     createdAt: "2024-01-15T11:45:00Z"
 *                     resolvedAt: null
 *                     server:
 *                       id: "server789"
 *                       name: "Load Balancer"
 *                       hostname: "lb01.example.com"
 *               empty_results:
 *                 summary: No alerts match the filter criteria
 *                 value: []
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_severity:
 *                 summary: Invalid severity parameter
 *                 value:
 *                   error: "Invalid query parameters"
 *                   details:
 *                     - code: "invalid_enum_value"
 *                       expected: "LOW | MEDIUM | HIGH | CRITICAL"
 *                       received: "EXTREME"
 *                       path: ["severity"]
 *                       message: "Invalid enum value. Expected 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', received 'EXTREME'"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", async (req, res) => {
  try {
    const query = alertsQuerySchema.parse(req.query)

    const where: any = {}
    if (query.serverId) where.serverId = query.serverId
    if (query.status) where.status = query.status
    if (query.severity) where.severity = query.severity

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: query.limit || 50,
    })

    res.json(alerts)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.issues })
    }

    logger.error("Error fetching alerts:", error)
    res.status(500).json({ error: "Failed to fetch alerts" })
  }
})

/**
 * @swagger
 * /api/alerts/active:
 *   get:
 *     summary: Get active alerts summary
 *     description: Get a summary count of active alerts grouped by severity level
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Active alerts summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlertSummary'
 *             examples:
 *               normal_load:
 *                 summary: Normal alert load
 *                 value:
 *                   total: 8
 *                   critical: 1
 *                   high: 2
 *                   medium: 4
 *                   low: 1
 *               high_load:
 *                 summary: High alert load with multiple critical issues
 *                 value:
 *                   total: 25
 *                   critical: 5
 *                   high: 8
 *                   medium: 10
 *                   low: 2
 *               no_alerts:
 *                 summary: No active alerts (healthy system)
 *                 value:
 *                   total: 0
 *                   critical: 0
 *                   high: 0
 *                   medium: 0
 *                   low: 0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/active", async (req, res) => {
  try {
    const alertCounts = await prisma.alert.groupBy({
      by: ["severity"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    })

    const summary = {
      total: alertCounts.reduce((sum, item) => sum + item._count.id, 0),
      critical: alertCounts.find((item) => item.severity === "CRITICAL")?._count.id || 0,
      high: alertCounts.find((item) => item.severity === "HIGH")?._count.id || 0,
      medium: alertCounts.find((item) => item.severity === "MEDIUM")?._count.id || 0,
      low: alertCounts.find((item) => item.severity === "LOW")?._count.id || 0,
    }

    res.json(summary)
  } catch (error) {
    logger.error("Error fetching active alerts:", error)
    res.status(500).json({ error: "Failed to fetch active alerts" })
  }
})

/**
 * @swagger
 * /api/alerts/{id}:
 *   put:
 *     summary: Update alert status
 *     description: Update the status of a specific alert (acknowledge, resolve, or reactivate)
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the alert to update
 *         schema:
 *           type: string
 *           example: "alert123abc456def789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertUpdateRequest'
 *           examples:
 *             acknowledge:
 *               summary: Acknowledge an alert
 *               value:
 *                 status: "ACKNOWLEDGED"
 *             resolve:
 *               summary: Resolve an alert
 *               value:
 *                 status: "RESOLVED"
 *             reactivate:
 *               summary: Reactivate a resolved alert
 *               value:
 *                 status: "ACTIVE"
 *     responses:
 *       200:
 *         description: Alert status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *             examples:
 *               acknowledged_alert:
 *                 summary: Successfully acknowledged alert
 *                 value:
 *                   id: "alert123abc456def789"
 *                   serverId: "server123"
 *                   title: "High CPU Usage"
 *                   description: "CPU usage has exceeded 85% for the last 5 minutes"
 *                   severity: "HIGH"
 *                   status: "ACKNOWLEDGED"
 *                   metricType: "cpu_usage"
 *                   threshold: 85
 *                   actualValue: 92.5
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   resolvedAt: null
 *                   server:
 *                     id: "server123"
 *                     name: "Web Server 01"
 *                     hostname: "web01.example.com"
 *               resolved_alert:
 *                 summary: Successfully resolved alert
 *                 value:
 *                   id: "alert123abc456def789"
 *                   serverId: "server123"
 *                   title: "High CPU Usage"
 *                   description: "CPU usage has exceeded 85% for the last 5 minutes"
 *                   severity: "HIGH"
 *                   status: "RESOLVED"
 *                   metricType: "cpu_usage"
 *                   threshold: 85
 *                   actualValue: 92.5
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   resolvedAt: "2024-01-15T11:15:00Z"
 *                   server:
 *                     id: "server123"
 *                     name: "Web Server 01"
 *                     hostname: "web01.example.com"
 *       400:
 *         description: Bad request - invalid status value or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_status:
 *                 summary: Invalid status value
 *                 value:
 *                   error: "Validation failed"
 *                   details:
 *                     - code: "invalid_enum_value"
 *                       expected: "ACTIVE | RESOLVED | ACKNOWLEDGED"
 *                       received: "PENDING"
 *                       path: ["status"]
 *                       message: "Invalid enum value. Expected 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED', received 'PENDING'"
 *       404:
 *         description: Alert not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Alert not found
 *                 value:
 *                   error: "Failed to update alert"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete an alert
 *     description: Permanently delete an alert from the system
 *     tags: [Alerts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the alert to delete
 *         schema:
 *           type: string
 *           example: "alert123abc456def789"
 *     responses:
 *       204:
 *         description: Alert deleted successfully (no content returned)
 *       404:
 *         description: Alert not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Alert not found
 *                 value:
 *                   error: "Failed to delete alert"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const validatedData = updateAlertSchema.parse(req.body)

    const updateData: any = { status: validatedData.status }
    if (validatedData.status === "RESOLVED") {
      updateData.resolvedAt = new Date()
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: updateData,
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
    })

    logger.info("Alert updated:", { alertId: alert.id, status: alert.status })
    res.json(alert)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.issues })
    }

    logger.error("Error updating alert:", error)
    res.status(500).json({ error: "Failed to update alert" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    await prisma.alert.delete({
      where: { id },
    })

    logger.info("Alert deleted:", { alertId: id })
    res.status(204).send()
  } catch (error) {
    logger.error("Error deleting alert:", error)
    res.status(500).json({ error: "Failed to delete alert" })
  }
})

export { router as alertsRouter }