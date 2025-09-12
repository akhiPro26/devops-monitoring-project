import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"

const router = express.Router()
const prisma = new PrismaClient()

const templateSchema = z.object({
  name: z.string(),
  type: z.enum(["alert", "report", "system"]),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// Create template
router.post("/", async (req, res, next) => {
  try {
    const templateData = templateSchema.parse(req.body)

    const template = await prisma.notificationTemplate.create({
      data: {
        ...templateData,
        variables: templateData.variables || [],
      },
    })

    res.status(201).json({
      success: true,
      data: template,
    })
  } catch (error) {
    next(error)
  }
})

// Get all templates
router.get("/", async (req, res, next) => {
  try {
    const { type, isActive } = req.query

    const templates = await prisma.notificationTemplate.findMany({
      where: {
        ...(type && { type: type as string }),
        ...(isActive !== undefined && { isActive: isActive === "true" }),
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    next(error)
  }
})

// Get template by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      })
    }

    res.json({
      success: true,
      data: template,
    })
  } catch (error) {
    next(error)
  }
})

// Update template
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = templateSchema.partial().parse(req.body)

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: updateData,
    })

    res.json({
      success: true,
      data: template,
    })
  } catch (error) {
    next(error)
  }
})

// Delete template
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.notificationTemplate.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router
