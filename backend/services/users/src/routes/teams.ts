import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticateToken, type AuthRequest } from "../middlewares/auth"

const router = express.Router()
const prisma = new PrismaClient()

// Create team
const createTeamSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
})


router.post("/", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const { name, description } = createTeamSchema.parse(req.body);

        const team = await prisma.team.create({
            data: {
                name,
                description,
                creatorId: req.user!.id,
                members: {
                    create: {
                        userId: req.user!.id,
                        role: "OWNER"
                    },
                },
            },
            include: {
                creator: {
                    select: { id: true, username: true, email: true },
                },

                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true },
                        },
                    },
                },
            },
        })


        res.status(201).json({ message: "Team created successfully", team })
    } catch (error) {
        next(error);
    }
})

router.get("/my-team", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const teams = await prisma.team.findMany({
            where: {
                members: {
                    some: {
                        userId: req.user!.id,
                    },
                },
            },

            include: {
                creator: {
                    select: { id: true, username: true, email: true },
                },

                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true },
                        },
                    },
                },
                servers: {
                    select: { id: true, name: true, hostname: true, status: true },
                }
            }
        });

        res.json({ teams });
    } catch (error) {
        next(error);
    }
})

//  adding a new member to team


const addMemberSchema = z.object({
    userId: z.string(),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
})

router.post("/:teamId/members", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const { teamId } = req.params
        const { userId, role } = addMemberSchema.parse(req.body)

        // Check if user is team owner or admin
        const membership = await prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId: req.user!.id,
                    teamId,
                },
            },
        })

        if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
            return res.status(403).json({ error: "Insufficient permissions" })
        }

        // Add member
        const newMember = await prisma.teamMember.create({
            data: {
                userId,
                teamId,
                role,
            },
            include: {
                user: {
                    select: { id: true, username: true, email: true },
                },
            },
        })

        res.status(201).json({ message: "Member added successfully", member: newMember })
    } catch (error) {
        next(error)
    }
})

export { router as teamRoutes }