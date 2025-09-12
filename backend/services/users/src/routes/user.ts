import express from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
import { authenticateToken, requireRole, type AuthRequest } from "../middlewares/auth"

const router = express.Router()
const prisma = new PrismaClient()

// Get all users (Admin only)
router.get("/", authenticateToken, requireRole(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        teamMemberships: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({ users })
  } catch (error) {
    next(error)
  }
})

// Get user by ID
router.get("/:id", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Users can only view their own profile unless they're admin
    if (req.user!.id !== id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
        serverAccess: {
          include: {
            server: {
              select: { id: true, name: true, hostname: true },
            },
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// Update user
const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "USER"]).optional(),
  isActive: z.boolean().optional(),
})

router.put("/:id", authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const updateData = updateUserSchema.parse(req.body)

    // Users can only update their own profile (except role/isActive)
    // Admins can update anyone
    if (req.user!.id !== id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" })
    }

    // Only admins can change role and isActive status
    if ((updateData.role || updateData.isActive !== undefined) && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    res.json({ message: "User updated successfully", user })
  } catch (error) {
    next(error)
  }
})

export { router as userRoutes }
