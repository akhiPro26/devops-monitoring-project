import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticateToken, type AuthRequest } from "../middlewares/auth"
import { EventBus, EventTypes } from "../../../../shared/utils/eventBus"
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

const eventBus = EventBus.getInstance("user-service")

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
        
        // PUBLISH THE EVENT
        eventBus.publish(EventTypes.SERVER_ADDED, { serverId: server.id })

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

router.get("/inter-service/all-servers", async (req, res, next) => {
  try {
    const servers = await prisma.server.findMany({
      include: {
        team: {
          select: { id: true, name: true },
        },
        serverAccess: {
          select: { permissions: true, userId: true },
        },
      },
    });

    res.json( servers );
    
  } catch (error) {
    next(error);
  }
});

router.get("/inter-service/server/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        team: {
          select: { id: true, name: true },
        },
        serverAccess: {
          select: { permissions: true, userId: true },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    res.json({ server });
  } catch (error) {
    next(error);
  }
});

router.put("/inter-service/server/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: "ONLINE" | "OFFLINE" };

    if (!status || !["ONLINE", "OFFLINE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const server = await prisma.server.update({
      where: { id },
      data: { status },
      include: {
        team: { select: { id: true, name: true } },
        serverAccess: { select: { permissions: true, userId: true } },
      },
    });

    res.json({ message: "Server status updated successfully", server });
  } catch (error) {
    // If record doesn't exist, Prisma throws an error
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Server not found" });
    }
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: "ONLINE" | "OFFLINE" };

    if (!status || !["ONLINE", "OFFLINE"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const server = await prisma.server.update({
      where: { id },
      data: { status },
      include: {
        team: { select: { id: true, name: true } },
        serverAccess: { select: { permissions: true, userId: true } },
      },
    });

    res.json({ message: "Server status updated successfully", server });
  } catch (error) {
    // If record doesn't exist, Prisma throws an error
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Server not found" });
    }
    next(error);
  }
});

// Delete server
router.delete("/:id", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Check if server exists and user has access
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        team: {
          select: { id: true, members: { select: { userId: true } } },
        },
        serverAccess: {
          where: { userId: req.user!.id },
        },
      },
    })

    if (!server) {
      return res.status(404).json({ error: "Server not found" })
    }

    // Check if user has permission (either team member or admin access)
    const isTeamMember = server.team.members.some((m) => m.userId === req.user!.id)
    const hasAdminAccess = server.serverAccess.some((a) => a.permissions.includes("ADMIN"))

    if (!isTeamMember && !hasAdminAccess) {
      return res.status(403).json({ error: "You do not have permission to delete this server" })
    }

    // Delete server
    await prisma.server.delete({
      where: { id },
    })

    // PUBLISH EVENT
    eventBus.publish(EventTypes.SERVER_DELETED, { serverId: id })

    res.status(204).send()
  } catch (error) {
    if ((error as any).code === "P2025") {
      return res.status(404).json({ error: "Server not found" })
    }
    next(error)
  }
})


export { router as serverRoutes }
