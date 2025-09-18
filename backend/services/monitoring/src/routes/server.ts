import { Router } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "../utils/logger"

const router = Router()
const prisma = new PrismaClient()

// Validation schemas
const createServerSchema = z.object({
  name: z.string().min(1),
  hostname: z.string().min(1),
  ipAddress: z.string().refine((val) => {
    // IPv4 regex pattern
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // IPv6 regex pattern (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(val) || ipv6Regex.test(val)
  }, {
    message: "Invalid IP address format"
  }),
  port: z.number().int().min(1).max(65535).optional(),
})

const updateServerSchema = z.object({
  name: z.string().min(1).optional(),
  hostname: z.string().min(1).optional(),
  ipAddress: z.string().refine((val) => {
    // IPv4 regex pattern
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // IPv6 regex pattern (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(val) || ipv6Regex.test(val)
  }, {
    message: "Invalid IP address format"
  }),
  port: z.number().int().min(1).max(65535).optional(),
  status: z.enum(["ONLINE", "OFFLINE", "UNKNOWN", "MAINTENANCE"]).optional(),
})

/**
 * @swagger
 * /servers:
 *   get:
 *     summary: Get all servers
 *     description: Retrieve a list of all servers with their metrics and alert counts
 *     tags:
 *       - Servers
 *     responses:
 *       200:
 *         description: List of servers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServerWithCounts'
 *             example:
 *               - id: "server-123"
 *                 name: "Web Server 1"
 *                 hostname: "web01.example.com"
 *                 ipAddress: "192.168.1.100"
 *                 port: 80
 *                 status: "ONLINE"
 *                 createdAt: "2023-01-15T10:30:00Z"
 *                 updatedAt: "2023-01-15T10:30:00Z"
 *                 _count:
 *                   metrics: 1250
 *                   alerts: 2
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// router.get("/", async (req, res) => {
//   try {
//     const servers = await prisma.server.findMany({
//       include: {
//         _count: {
//           select: {
//             metrics: true,
//             alerts: {
//               where: { status: "ACTIVE" },
//             },
//           },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     })

//     res.json(servers)
//   } catch (error) {
//     logger.error("Error fetching servers:", error)
//     res.status(500).json({ error: "Failed to fetch servers" })
//   }
// })

/**
 * @swagger
 * /servers/{id}:
 *   get:
 *     summary: Get server by ID
 *     description: Retrieve detailed information about a specific server including metrics, alerts, and health checks
 *     tags:
 *       - Servers
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Server ID
 *         schema:
 *           type: string
 *         example: "server-123"
 *     responses:
 *       200:
 *         description: Server details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerWithDetails'
 *             example:
 *               id: "server-123"
 *               name: "Web Server 1"
 *               hostname: "web01.example.com"
 *               ipAddress: "192.168.1.100"
 *               port: 80
 *               status: "ONLINE"
 *               createdAt: "2023-01-15T10:30:00Z"
 *               updatedAt: "2023-01-15T10:30:00Z"
 *               metrics:
 *                 - id: "metric-1"
 *                   cpuUsage: 45.2
 *                   memoryUsage: 67.8
 *                   diskUsage: 32.1
 *                   timestamp: "2023-01-15T12:00:00Z"
 *               alerts:
 *                 - id: "alert-1"
 *                   message: "High CPU usage detected"
 *                   severity: "WARNING"
 *                   status: "ACTIVE"
 *                   createdAt: "2023-01-15T11:45:00Z"
 *               healthChecks:
 *                 - id: "health-1"
 *                   status: "HEALTHY"
 *                   responseTime: 150
 *                   timestamp: "2023-01-15T12:00:00Z"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Fetch metrics, alerts, and health checks for the given server ID
    const [metrics, alerts, healthChecks] = await Promise.all([
      prisma.metric.findMany({
        where: { serverId: id },
        take: 100,
        orderBy: { timestamp: "desc" },
      }),
      prisma.alert.findMany({
        where: { serverId: id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.healthCheck.findMany({
        where: { serverId: id },
        take: 10,
        orderBy: { timestamp: "desc" },
      }),
    ])

    // Return the combined monitoring data for the server
    res.json({
      serverId: id,
      metrics,
      alerts,
      healthChecks,
    })
  } catch (error) {
    logger.error("Error fetching monitoring data:", error)
    res.status(500).json({ error: "Failed to fetch monitoring data" })
  }
})

/**
 * @swagger
 * /servers:
 *   post:
 *     summary: Create a new server
 *     description: Create a new server entry with validation
 *     tags:
 *       - Servers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServerRequest'
 *           example:
 *             name: "Database Server"
 *             hostname: "db01.example.com"
 *             ipAddress: "192.168.1.200"
 *             port: 5432
 *     responses:
 *       201:
 *         description: Server created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *             example:
 *               id: "server-456"
 *               name: "Database Server"
 *               hostname: "db01.example.com"
 *               ipAddress: "192.168.1.200"
 *               port: 5432
 *               status: "UNKNOWN"
 *               createdAt: "2023-01-15T11:00:00Z"
 *               updatedAt: "2023-01-15T11:00:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// router.post("/", async (req, res) => {
//   try {
//     const validatedData = createServerSchema.parse(req.body)

//     const server = await prisma.server.create({
//       data: validatedData,
//     })

//     logger.info("Server created:", { serverId: server.id, name: server.name })
//     res.status(201).json(server)
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ error: "Validation failed", details: error.issues })
//     }

//     logger.error("Error creating server:", error)
//     res.status(500).json({ error: "Failed to create server" })
//   }
// })

/**
 * @swagger
 * /servers/{id}:
 *   put:
 *     summary: Update server
 *     description: Update an existing server's information
 *     tags:
 *       - Servers
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Server ID
 *         schema:
 *           type: string
 *         example: "server-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateServerRequest'
 *           example:
 *             name: "Updated Web Server"
 *             status: "MAINTENANCE"
 *             port: 8080
 *     responses:
 *       200:
 *         description: Server updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Server'
 *             example:
 *               id: "server-123"
 *               name: "Updated Web Server"
 *               hostname: "web01.example.com"
 *               ipAddress: "192.168.1.100"
 *               port: 8080
 *               status: "MAINTENANCE"
 *               createdAt: "2023-01-15T10:30:00Z"
 *               updatedAt: "2023-01-15T12:15:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
//  */
// router.put("/:id", async (req, res) => {
//   try {
//     const { id } = req.params
//     const validatedData = updateServerSchema.parse(req.body)

//     const server = await prisma.server.update({
//       where: { id },
//       data: validatedData,
//     })

//     logger.info("Server updated:", { serverId: server.id })
//     res.json(server)
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return res.status(400).json({ error: "Validation failed", details: error.issues })
//     }

//     logger.error("Error updating server:", error)
//     res.status(500).json({ error: "Failed to update server" })
//   }
// })

/**
 * @swagger
 * /servers/{id}:
 *   delete:
 *     summary: Delete server
 *     description: Remove a server from the system
 *     tags:
 *       - Servers
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Server ID
 *         schema:
 *           type: string
 *         example: "server-123"
 *     responses:
 *       204:
 *         description: Server deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params

//     await prisma.server.delete({
//       where: { id },
//     })

//     logger.info("Server deleted:", { serverId: id })
//     res.status(204).send()
//   } catch (error) {
//     logger.error("Error deleting server:", error)
//     res.status(500).json({ error: "Failed to delete server" })
//   }
// })

export { router as serversRouter }