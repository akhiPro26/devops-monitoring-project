import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "../utils/logger"

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const metricsQuerySchema = z.object({
  serverId: z.string().optional(),
  type: z
    .enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_USAGE", "NETWORK_IN", "NETWORK_OUT", "LOAD_AVERAGE", "UPTIME"])
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Metric:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the metric
 *           example: "metric123abc456def789"
 *         serverId:
 *           type: string
 *           description: ID of the server this metric belongs to
 *           example: "server123"
 *         type:
 *           type: string
 *           description: Type of metric being measured
 *           enum: [CPU_USAGE, MEMORY_USAGE, DISK_USAGE, NETWORK_IN, NETWORK_OUT, LOAD_AVERAGE, UPTIME]
 *           example: "CPU_USAGE"
 *         value:
 *           type: number
 *           description: Numeric value of the metric
 *           example: 75.5
 *         unit:
 *           type: string
 *           description: Unit of measurement for the metric value
 *           example: "percent"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the metric was recorded
 *           example: "2024-01-15T10:30:00Z"
 *         tags:
 *           type: object
 *           description: Additional metadata tags for the metric
 *           properties:
 *             source:
 *               type: string
 *               example: "system"
 *             interval:
 *               type: string
 *               example: "5m"
 *           additionalProperties: true
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
 *     MetricSummary:
 *       type: object
 *       properties:
 *         cpu_usage:
 *           type: object
 *           nullable: true
 *           properties:
 *             value:
 *               type: number
 *               example: 75.5
 *             unit:
 *               type: string
 *               example: "percent"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *         memory_usage:
 *           type: object
 *           nullable: true
 *           properties:
 *             value:
 *               type: number
 *               example: 68.2
 *             unit:
 *               type: string
 *               example: "percent"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *         disk_usage:
 *           type: object
 *           nullable: true
 *           properties:
 *             value:
 *               type: number
 *               example: 45.8
 *             unit:
 *               type: string
 *               example: "percent"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *         load_average:
 *           type: object
 *           nullable: true
 *           properties:
 *             value:
 *               type: number
 *               example: 1.25
 *             unit:
 *               type: string
 *               example: "load"
 *             timestamp:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
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
 * /api/metrics:
 *   get:
 *     summary: Get metrics with filtering options
 *     description: Retrieve server metrics with optional filtering by server, metric type, time range, and pagination
 *     tags: [Metrics]
 *     parameters:
 *       - in: query
 *         name: serverId
 *         description: Filter metrics by specific server ID
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: query
 *         name: type
 *         description: Filter metrics by type
 *         schema:
 *           type: string
 *           enum: [CPU_USAGE, MEMORY_USAGE, DISK_USAGE, NETWORK_IN, NETWORK_OUT, LOAD_AVERAGE, UPTIME]
 *           example: "CPU_USAGE"
 *       - in: query
 *         name: from
 *         description: Start time for metric data (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T09:00:00Z"
 *       - in: query
 *         name: to
 *         description: End time for metric data (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T12:00:00Z"
 *       - in: query
 *         name: limit
 *         description: Maximum number of metrics to return (1-1000)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *           example: 50
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Metric'
 *             examples:
 *               mixed_metrics:
 *                 summary: Mixed metrics from multiple servers
 *                 value:
 *                   - id: "metric123abc456def789"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 75.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                     server:
 *                       id: "server123"
 *                       name: "Web Server 01"
 *                       hostname: "web01.example.com"
 *                   - id: "metric456def789abc123"
 *                     serverId: "server123"
 *                     type: "MEMORY_USAGE"
 *                     value: 68.2
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                     server:
 *                       id: "server123"
 *                       name: "Web Server 01"
 *                       hostname: "web01.example.com"
 *                   - id: "metric789ghi012jkl345"
 *                     serverId: "server456"
 *                     type: "DISK_USAGE"
 *                     value: 85.7
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:29:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                       partition: "/var"
 *                     server:
 *                       id: "server456"
 *                       name: "Database Server"
 *                       hostname: "db01.example.com"
 *               cpu_metrics_only:
 *                 summary: CPU usage metrics filtered by type
 *                 value:
 *                   - id: "metric123abc456def789"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 75.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                     server:
 *                       id: "server123"
 *                       name: "Web Server 01"
 *                       hostname: "web01.example.com"
 *                   - id: "metric456def789abc123"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 72.1
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:25:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                     server:
 *                       id: "server123"
 *                       name: "Web Server 01"
 *                       hostname: "web01.example.com"
 *               network_metrics:
 *                 summary: Network metrics showing traffic patterns
 *                 value:
 *                   - id: "metric101net456in789"
 *                     serverId: "server789"
 *                     type: "NETWORK_IN"
 *                     value: 1048576
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *                     server:
 *                       id: "server789"
 *                       name: "Load Balancer"
 *                       hostname: "lb01.example.com"
 *                   - id: "metric202net567out890"
 *                     serverId: "server789"
 *                     type: "NETWORK_OUT"
 *                     value: 2097152
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *                     server:
 *                       id: "server789"
 *                       name: "Load Balancer"
 *                       hostname: "lb01.example.com"
 *               empty_results:
 *                 summary: No metrics match the filter criteria
 *                 value: []
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_type:
 *                 summary: Invalid metric type parameter
 *                 value:
 *                   error: "Invalid query parameters"
 *                   details:
 *                     - code: "invalid_enum_value"
 *                       expected: "CPU_USAGE | MEMORY_USAGE | DISK_USAGE | NETWORK_IN | NETWORK_OUT | LOAD_AVERAGE | UPTIME"
 *                       received: "INVALID_TYPE"
 *                       path: ["type"]
 *                       message: "Invalid enum value. Expected 'CPU_USAGE' | 'MEMORY_USAGE' | 'DISK_USAGE' | 'NETWORK_IN' | 'NETWORK_OUT' | 'LOAD_AVERAGE' | 'UPTIME', received 'INVALID_TYPE'"
 *               invalid_datetime:
 *                 summary: Invalid datetime format
 *                 value:
 *                   error: "Invalid query parameters"
 *                   details:
 *                     - code: "invalid_string"
 *                       expected: "ISO 8601 datetime"
 *                       received: "2024-01-15"
 *                       path: ["from"]
 *                       message: "Invalid datetime format. Expected ISO 8601 format (e.g., 2024-01-15T10:30:00Z)"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", async (req, res) => {
  try {
    const query = metricsQuerySchema.parse(req.query)

    const where: any = {}
    if (query.serverId) where.serverId = query.serverId
    if (query.type) where.type = query.type
    if (query.from || query.to) {
      where.timestamp = {}
      if (query.from) where.timestamp.gte = new Date(query.from)
      if (query.to) where.timestamp.lte = new Date(query.to)
    }

    const metrics = await prisma.metric.findMany({
      where,
      include: {
        server: {
          select: { id: true, name: true, hostname: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: query.limit || 100,
    })

    res.json(metrics)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.issues })
    }

    logger.error("Error fetching metrics:", error)
    res.status(500).json({ error: "Failed to fetch metrics" })
  }
})

/**
 * @swagger
 * /api/metrics/summary/{serverId}:
 *   get:
 *     summary: Get latest metrics summary for a server
 *     description: Retrieve the most recent values for key server metrics (CPU, Memory, Disk, Load Average)
 *     tags: [Metrics]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get metrics summary for
 *         schema:
 *           type: string
 *           example: "server123"
 *     responses:
 *       200:
 *         description: Metrics summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricSummary'
 *             examples:
 *               healthy_server:
 *                 summary: Server with normal resource usage
 *                 value:
 *                   cpu_usage:
 *                     value: 45.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   memory_usage:
 *                     value: 68.2
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   disk_usage:
 *                     value: 35.8
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   load_average:
 *                     value: 0.85
 *                     unit: "load"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *               high_load_server:
 *                 summary: Server experiencing high resource usage
 *                 value:
 *                   cpu_usage:
 *                     value: 89.7
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   memory_usage:
 *                     value: 92.3
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   disk_usage:
 *                     value: 78.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   load_average:
 *                     value: 3.45
 *                     unit: "load"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *               new_server:
 *                 summary: New server with limited metric history
 *                 value:
 *                   cpu_usage:
 *                     value: 12.1
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   memory_usage:
 *                     value: 25.4
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                   disk_usage: null
 *                   load_average: null
 *               no_metrics:
 *                 summary: Server with no recorded metrics
 *                 value:
 *                   cpu_usage: null
 *                   memory_usage: null
 *                   disk_usage: null
 *                   load_average: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/summary/:serverId", async (req, res) => {
  try {
    const { serverId } = req.params

    // Get latest metric of each type
    const metricTypes = ["CPU_USAGE", "MEMORY_USAGE", "DISK_USAGE", "LOAD_AVERAGE"]
    const summary: any = {}

    for (const type of metricTypes) {
      const latestMetric = await prisma.metric.findFirst({
        where: { serverId, type: type as any },
        orderBy: { timestamp: "desc" },
      })

      if (latestMetric) {
        summary[type.toLowerCase()] = {
          value: latestMetric.value,
          unit: latestMetric.unit,
          timestamp: latestMetric.timestamp,
        }
      }
    }

    res.json(summary)
  } catch (error) {
    logger.error("Error fetching metrics summary:", error)
    res.status(500).json({ error: "Failed to fetch metrics summary" })
  }
})

/**
 * @swagger
 * /api/metrics/history/{serverId}/{type}:
 *   get:
 *     summary: Get metric history for a specific type
 *     description: Retrieve historical data for a specific metric type over a specified time period
 *     tags: [Metrics]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get metric history for
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: path
 *         name: type
 *         required: true
 *         description: Type of metric to retrieve (case-insensitive)
 *         schema:
 *           type: string
 *           enum: [cpu_usage, memory_usage, disk_usage, network_in, network_out, load_average, uptime]
 *           example: "cpu_usage"
 *       - in: query
 *         name: hours
 *         description: Number of hours of history to retrieve
 *         schema:
 *           type: string
 *           default: "24"
 *           example: "12"
 *     responses:
 *       200:
 *         description: Metric history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Metric'
 *             examples:
 *               cpu_usage_trend:
 *                 summary: CPU usage trend over 24 hours showing gradual increase
 *                 value:
 *                   - id: "metric001cpu123"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 35.2
 *                     unit: "percent"
 *                     timestamp: "2024-01-14T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric002cpu124"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 42.1
 *                     unit: "percent"
 *                     timestamp: "2024-01-14T14:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric003cpu125"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 68.7
 *                     unit: "percent"
 *                     timestamp: "2024-01-14T18:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric004cpu126"
 *                     serverId: "server123"
 *                     type: "CPU_USAGE"
 *                     value: 75.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *               memory_usage_stable:
 *                 summary: Memory usage showing stable pattern
 *                 value:
 *                   - id: "metric005mem123"
 *                     serverId: "server456"
 *                     type: "MEMORY_USAGE"
 *                     value: 65.1
 *                     unit: "percent"
 *                     timestamp: "2024-01-14T22:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric006mem124"
 *                     serverId: "server456"
 *                     type: "MEMORY_USAGE"
 *                     value: 67.2
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T02:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric007mem125"
 *                     serverId: "server456"
 *                     type: "MEMORY_USAGE"
 *                     value: 68.8
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T06:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *                   - id: "metric008mem126"
 *                     serverId: "server456"
 *                     type: "MEMORY_USAGE"
 *                     value: 66.5
 *                     unit: "percent"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interval: "5m"
 *               network_traffic_spike:
 *                 summary: Network traffic showing traffic spike
 *                 value:
 *                   - id: "metric009net123"
 *                     serverId: "server789"
 *                     type: "NETWORK_IN"
 *                     value: 524288
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T08:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *                   - id: "metric010net124"
 *                     serverId: "server789"
 *                     type: "NETWORK_IN"
 *                     value: 1048576
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T09:00:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *                   - id: "metric011net125"
 *                     serverId: "server789"
 *                     type: "NETWORK_IN"
 *                     value: 5242880
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T09:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *                   - id: "metric012net126"
 *                     serverId: "server789"
 *                     type: "NETWORK_IN"
 *                     value: 2097152
 *                     unit: "bytes/sec"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     tags:
 *                       source: "system"
 *                       interface: "eth0"
 *               empty_history:
 *                 summary: No metrics found for the specified time range
 *                 value: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/history/:serverId/:type", async (req, res) => {
  try {
    const { serverId, type } = req.params
    const { hours = "24" } = req.query

    const hoursAgo = new Date()
    hoursAgo.setHours(hoursAgo.getHours() - Number.parseInt(hours as string))

    const metrics = await prisma.metric.findMany({
      where: {
        serverId,
        type: type.toUpperCase() as any,
        timestamp: { gte: hoursAgo },
      },
      orderBy: { timestamp: "asc" },
    })

    res.json(metrics)
  } catch (error) {
    logger.error("Error fetching metric history:", error)
    res.status(500).json({ error: "Failed to fetch metric history" })
  }
})

export { router as metricsRouter }