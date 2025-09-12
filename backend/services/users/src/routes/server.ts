import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticateToken, type AuthRequest } from "../middlewares/auth"

const router = express.Router()
const prisma = new PrismaClient()

// Create server
const createServerSchema = z.object({
    name: z.string().min(1).max(100),
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
    environment: z.enum(["DEVELOPMENT", "STAGING", "PRODUCTION"]),
    description: z.string().optional(),
    teamId: z.string(),
})

router.post("/", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const serverData = createServerSchema.parse(req.body)

        // Check if user is member of the team
        const membership = await prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId: req.user!.id,
                    teamId: serverData.teamId,
                },
            },
        })

        if (!membership) {
            return res.status(403).json({ error: "Access denied to team" })
        }

        const server = await prisma.server.create({
            data: serverData,
            include: {
                team: {
                    select: { id: true, name: true },
                },
            },
        })

        // Grant creator admin access to the server
        await prisma.serverAccess.create({
            data: {
                userId: req.user!.id,
                serverId: server.id,
                permissions: ["READ", "WRITE", "ADMIN"],
            },
        })

        res.status(201).json({ message: "Server created successfully", server })
    } catch (error) {
        next(error)
    }
})

// Get servers user has access to
router.get("/", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const servers = await prisma.server.findMany({
            where: {
                OR: [
                    {
                        team: {
                            members: {
                                some: {
                                    userId: req.user!.id,
                                },
                            },
                        },
                    },
                    {
                        serverAccess: {
                            some: {
                                userId: req.user!.id,
                            },
                        },
                    },
                ],
            },
            include: {
                team: {
                    select: { id: true, name: true },
                },
                serverAccess: {
                    where: {
                        userId: req.user!.id,
                    },
                    select: { permissions: true },
                },
            },
        })

        res.json({ servers })
    } catch (error) {
        next(error)
    }
})

export { router as serverRoutes }
