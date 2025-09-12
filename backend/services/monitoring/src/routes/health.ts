import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { logger } from "../utils/logger"

const router = Router()
const prisma = new PrismaClient()

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthCheck:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the health check
 *           example: "health123abc456def789"
 *         serverId:
 *           type: string
 *           description: ID of the server this health check belongs to
 *           example: "server123"
 *         status:
 *           type: string
 *           description: Overall health status of the server
 *           enum: [HEALTHY, WARNING, CRITICAL, UNKNOWN]
 *           example: "HEALTHY"
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *           example: 250
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *           example: 86400
 *         cpuUsage:
 *           type: number
 *           description: CPU usage percentage
 *           minimum: 0
 *           maximum: 100
 *           example: 45.5
 *         memoryUsage:
 *           type: number
 *           description: Memory usage percentage
 *           minimum: 0
 *           maximum: 100
 *           example: 68.2
 *         diskUsage:
 *           type: number
 *           description: Disk usage percentage
 *           minimum: 0
 *           maximum: 100
 *           example: 35.8
 *         networkLatency:
 *           type: number
 *           description: Network latency in milliseconds
 *           example: 15.3
 *         servicesStatus:
 *           type: object
 *           description: Status of individual services running on the server
 *           properties:
 *             nginx:
 *               type: string
 *               enum: [running, stopped, error]
 *               example: "running"
 *             mysql:
 *               type: string
 *               enum: [running, stopped, error]
 *               example: "running"
 *             redis:
 *               type: string
 *               enum: [running, stopped, error]
 *               example: "running"
 *           additionalProperties:
 *             type: string
 *             enum: [running, stopped, error]
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the health check was performed
 *           example: "2024-01-15T10:30:00Z"
 *         details:
 *           type: object
 *           description: Additional health check details
 *           properties:
 *             checks:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Database Connection"
 *                   status:
 *                     type: string
 *                     enum: [pass, fail, warn]
 *                     example: "pass"
 *                   message:
 *                     type: string
 *                     example: "Connection established successfully"
 *                   responseTime:
 *                     type: number
 *                     example: 45
 *           additionalProperties: true
 * 
 *     ServerHealthOverview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Server ID
 *           example: "server123"
 *         name:
 *           type: string
 *           description: Server name
 *           example: "Web Server 01"
 *         hostname:
 *           type: string
 *           description: Server hostname
 *           example: "web01.example.com"
 *         status:
 *           type: string
 *           description: Current server status
 *           enum: [ACTIVE, INACTIVE, MAINTENANCE, ERROR]
 *           example: "ACTIVE"
 *         lastHealthCheck:
 *           allOf:
 *             - $ref: '#/components/schemas/HealthCheck'
 *             - nullable: true
 *               description: Most recent health check (null if no checks exist)
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Failed to fetch health checks"
 */

/**
 * @swagger
 * /api/health/checks/{serverId}:
 *   get:
 *     summary: Get health check history for a server
 *     description: Retrieve historical health check data for a specific server with pagination
 *     tags: [Health Monitoring]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get health checks for
 *         schema:
 *           type: string
 *           example: "server123"
 *       - in: query
 *         name: limit
 *         description: Maximum number of health checks to return
 *         schema:
 *           type: string
 *           default: "50"
 *           example: "20"
 *     responses:
 *       200:
 *         description: Health check history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HealthCheck'
 *             examples:
 *               healthy_server:
 *                 summary: Healthy server with normal metrics
 *                 value:
 *                   - id: "health123abc456def789"
 *                     serverId: "server123"
 *                     status: "HEALTHY"
 *                     responseTime: 250
 *                     uptime: 86400
 *                     cpuUsage: 45.5
 *                     memoryUsage: 68.2
 *                     diskUsage: 35.8
 *                     networkLatency: 15.3
 *                     servicesStatus:
 *                       nginx: "running"
 *                       mysql: "running"
 *                       redis: "running"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     details:
 *                       checks:
 *                         - name: "Database Connection"
 *                           status: "pass"
 *                           message: "Connection established successfully"
 *                           responseTime: 45
 *                         - name: "Disk Space"
 *                           status: "pass"
 *                           message: "Sufficient disk space available"
 *                           responseTime: 10
 *                   - id: "health456def789abc123"
 *                     serverId: "server123"
 *                     status: "HEALTHY"
 *                     responseTime: 245
 *                     uptime: 86340
 *                     cpuUsage: 42.1
 *                     memoryUsage: 65.8
 *                     diskUsage: 35.7
 *                     networkLatency: 12.8
 *                     servicesStatus:
 *                       nginx: "running"
 *                       mysql: "running"
 *                       redis: "running"
 *                     timestamp: "2024-01-15T10:25:00Z"
 *                     details:
 *                       checks:
 *                         - name: "Database Connection"
 *                           status: "pass"
 *                           message: "Connection established successfully"
 *                           responseTime: 42
 *               server_with_issues:
 *                 summary: Server with warning status and high resource usage
 *                 value:
 *                   - id: "health789ghi012jkl345"
 *                     serverId: "server456"
 *                     status: "WARNING"
 *                     responseTime: 850
 *                     uptime: 3600
 *                     cpuUsage: 85.2
 *                     memoryUsage: 92.1
 *                     diskUsage: 78.5
 *                     networkLatency: 45.7
 *                     servicesStatus:
 *                       nginx: "running"
 *                       mysql: "running"
 *                       redis: "error"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     details:
 *                       checks:
 *                         - name: "Database Connection"
 *                           status: "pass"
 *                           message: "Connection established but slow"
 *                           responseTime: 180
 *                         - name: "Redis Service"
 *                           status: "fail"
 *                           message: "Redis service not responding"
 *                           responseTime: 0
 *               empty_history:
 *                 summary: No health checks available
 *                 value: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Server error
 *                 value:
 *                   error: "Failed to fetch health checks"
 */
router.get("/checks/:serverId", async (req, res) => {
  try {
    const { serverId } = req.params
    const { limit = "50" } = req.query

    const healthChecks = await prisma.healthCheck.findMany({
      where: { serverId },
      orderBy: { timestamp: "desc" },
      take: Number.parseInt(limit as string),
    })

    res.json(healthChecks)
  } catch (error) {
    logger.error("Error fetching health checks:", error)
    res.status(500).json({ error: "Failed to fetch health checks" })
  }
})

/**
 * @swagger
 * /api/health/status/{serverId}:
 *   get:
 *     summary: Get latest health status for a server
 *     description: Retrieve the most recent health check result for a specific server
 *     tags: [Health Monitoring]
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         description: ID of the server to get health status for
 *         schema:
 *           type: string
 *           example: "server123"
 *     responses:
 *       200:
 *         description: Latest health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             examples:
 *               healthy_status:
 *                 summary: Server in healthy state
 *                 value:
 *                   id: "health123abc456def789"
 *                   serverId: "server123"
 *                   status: "HEALTHY"
 *                   responseTime: 250
 *                   uptime: 86400
 *                   cpuUsage: 45.5
 *                   memoryUsage: 68.2
 *                   diskUsage: 35.8
 *                   networkLatency: 15.3
 *                   servicesStatus:
 *                     nginx: "running"
 *                     mysql: "running"
 *                     redis: "running"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *                   details:
 *                     checks:
 *                       - name: "Database Connection"
 *                         status: "pass"
 *                         message: "Connection established successfully"
 *                         responseTime: 45
 *                       - name: "API Endpoint"
 *                         status: "pass"
 *                         message: "All endpoints responding normally"
 *                         responseTime: 120
 *               critical_status:
 *                 summary: Server in critical state
 *                 value:
 *                   id: "health456def789abc123"
 *                   serverId: "server789"
 *                   status: "CRITICAL"
 *                   responseTime: 2500
 *                   uptime: 300
 *                   cpuUsage: 98.5
 *                   memoryUsage: 95.2
 *                   diskUsage: 92.1
 *                   networkLatency: 150.7
 *                   servicesStatus:
 *                     nginx: "error"
 *                     mysql: "stopped"
 *                     redis: "error"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *                   details:
 *                     checks:
 *                       - name: "Database Connection"
 *                         status: "fail"
 *                         message: "Unable to connect to database"
 *                         responseTime: 0
 *                       - name: "Disk Space"
 *                         status: "fail"
 *                         message: "Disk space critically low"
 *                         responseTime: 10
 *               warning_status:
 *                 summary: Server with warning indicators
 *                 value:
 *                   id: "health789ghi012jkl345"
 *                   serverId: "server456"
 *                   status: "WARNING"
 *                   responseTime: 750
 *                   uptime: 7200
 *                   cpuUsage: 78.3
 *                   memoryUsage: 82.7
 *                   diskUsage: 85.2
 *                   networkLatency: 35.4
 *                   servicesStatus:
 *                     nginx: "running"
 *                     mysql: "running"
 *                     redis: "error"
 *                   timestamp: "2024-01-15T10:30:00Z"
 *                   details:
 *                     checks:
 *                       - name: "Database Connection"
 *                         status: "warn"
 *                         message: "Database responding slowly"
 *                         responseTime: 250
 *                       - name: "Memory Usage"
 *                         status: "warn"
 *                         message: "Memory usage above threshold"
 *                         responseTime: 15
 *       404:
 *         description: No health checks found for this server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_checks:
 *                 summary: Server has no health check history
 *                 value:
 *                   error: "No health checks found for this server"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/status/:serverId", async (req, res) => {
  try {
    const { serverId } = req.params

    const latestCheck = await prisma.healthCheck.findFirst({
      where: { serverId },
      orderBy: { timestamp: "desc" },
    })

    if (!latestCheck) {
      return res.status(404).json({ error: "No health checks found for this server" })
    }

    res.json(latestCheck)
  } catch (error) {
    logger.error("Error fetching health status:", error)
    res.status(500).json({ error: "Failed to fetch health status" })
  }
})

/**
 * @swagger
 * /api/health/overview:
 *   get:
 *     summary: Get health overview for all servers
 *     description: Retrieve a comprehensive health overview showing the current status of all servers with their latest health check results
 *     tags: [Health Monitoring]
 *     responses:
 *       200:
 *         description: Health overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServerHealthOverview'
 *             examples:
 *               mixed_infrastructure:
 *                 summary: Mixed infrastructure with healthy and problematic servers
 *                 value:
 *                   - id: "server123"
 *                     name: "Web Server 01"
 *                     hostname: "web01.example.com"
 *                     status: "ACTIVE"
 *                     lastHealthCheck:
 *                       id: "health123abc456def789"
 *                       serverId: "server123"
 *                       status: "HEALTHY"
 *                       responseTime: 250
 *                       uptime: 86400
 *                       cpuUsage: 45.5
 *                       memoryUsage: 68.2
 *                       diskUsage: 35.8
 *                       networkLatency: 15.3
 *                       servicesStatus:
 *                         nginx: "running"
 *                         mysql: "running"
 *                       timestamp: "2024-01-15T10:30:00Z"
 *                   - id: "server456"
 *                     name: "Database Server"
 *                     hostname: "db01.example.com"
 *                     status: "ACTIVE"
 *                     lastHealthCheck:
 *                       id: "health456def789abc123"
 *                       serverId: "server456"
 *                       status: "WARNING"
 *                       responseTime: 750
 *                       uptime: 7200
 *                       cpuUsage: 78.3
 *                       memoryUsage: 82.7
 *                       diskUsage: 85.2
 *                       networkLatency: 35.4
 *                       servicesStatus:
 *                         mysql: "running"
 *                         redis: "error"
 *                       timestamp: "2024-01-15T10:28:00Z"
 *                   - id: "server789"
 *                     name: "Load Balancer"
 *                     hostname: "lb01.example.com"
 *                     status: "ERROR"
 *                     lastHealthCheck:
 *                       id: "health789ghi012jkl345"
 *                       serverId: "server789"
 *                       status: "CRITICAL"
 *                       responseTime: 2500
 *                       uptime: 300
 *                       cpuUsage: 98.5
 *                       memoryUsage: 95.2
 *                       diskUsage: 92.1
 *                       networkLatency: 150.7
 *                       servicesStatus:
 *                         nginx: "error"
 *                         haproxy: "stopped"
 *                       timestamp: "2024-01-15T10:25:00Z"
 *                   - id: "server101"
 *                     name: "New Server"
 *                     hostname: "new01.example.com"
 *                     status: "MAINTENANCE"
 *                     lastHealthCheck: null
 *               healthy_infrastructure:
 *                 summary: All servers healthy
 *                 value:
 *                   - id: "server123"
 *                     name: "Web Server 01"
 *                     hostname: "web01.example.com"
 *                     status: "ACTIVE"
 *                     lastHealthCheck:
 *                       id: "health123abc456def789"
 *                       serverId: "server123"
 *                       status: "HEALTHY"
 *                       responseTime: 200
 *                       uptime: 172800
 *                       cpuUsage: 25.5
 *                       memoryUsage: 45.2
 *                       diskUsage: 30.1
 *                       networkLatency: 8.3
 *                       servicesStatus:
 *                         nginx: "running"
 *                         php-fpm: "running"
 *                       timestamp: "2024-01-15T10:30:00Z"
 *                   - id: "server456"
 *                     name: "Database Server"
 *                     hostname: "db01.example.com"
 *                     status: "ACTIVE"
 *                     lastHealthCheck:
 *                       id: "health456def789abc123"
 *                       serverId: "server456"
 *                       status: "HEALTHY"
 *                       responseTime: 150
 *                       uptime: 259200
 *                       cpuUsage: 35.8
 *                       memoryUsage: 58.7
 *                       diskUsage: 42.3
 *                       networkLatency: 5.2
 *                       servicesStatus:
 *                         mysql: "running"
 *                         redis: "running"
 *                       timestamp: "2024-01-15T10:30:00Z"
 *               empty_infrastructure:
 *                 summary: No servers registered
 *                 value: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Server error
 *                 value:
 *                   error: "Failed to fetch health overview"
 */
router.get("/overview", async (req, res) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        healthChecks: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
    })

    const overview = servers.map((server) => ({
      id: server.id,
      name: server.name,
      hostname: server.hostname,
      status: server.status,
      lastHealthCheck: server.healthChecks[0] || null,
    }))

    res.json(overview)
  } catch (error) {
    logger.error("Error fetching health overview:", error)
    res.status(500).json({ error: "Failed to fetch health overview" })
  }
})

export { router as healthRouter }