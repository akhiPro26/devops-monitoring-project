import { Router } from "express"
import { z } from "zod"
import { PrismaClient } from "@prisma/client"
// import { authenticateToken } from "../../../../shared/middleware/serviceAuth"
import { logger } from "../utils/logger"

const router = Router()
const prisma = new PrismaClient()

// Zod schema for alert rule validation
const alertRuleSchema = z.object({
  name: z.string().min(3).max(100),
  metricType: z.enum([
    "CPU_USAGE",
    "MEMORY_USAGE",
    "DISK_USAGE",
    "NETWORK_IN",
    "NETWORK_OUT",
    "LOAD_AVERAGE",
    "UPTIME",
  ]),
  condition: z.string().min(1), 
  threshold: z.number(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  enabled: z.boolean().default(true),
})


router.post("/", async (req, res, next) => {
  try {
    const data = alertRuleSchema.parse(req.body)
    const rule = await prisma.alertRule.create({ data })
    res.status(201).json(rule)
  } catch (error) {
    logger.error("Error creating alert rule:", error)
    next(error)
  }
})


router.get("/", async (req, res, next) => {
  try {
    const rules = await prisma.alertRule.findMany()
    res.status(200).json(rules)
  } catch (error) {
    logger.error("Error fetching alert rules:", error)
    next(error)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const rule = await prisma.alertRule.findUnique({ where: { id } })
    if (!rule) {
      return res.status(404).json({ error: "Alert rule not found" })
    }
    return res.status(200).json(rule) 
  } catch (error) {
    logger.error(`Error fetching alert rule ${req.params.id}:`, error)
    return next(error) 
  }
})



router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const data = alertRuleSchema.partial().parse(req.body)
    const updatedRule = await prisma.alertRule.update({
      where: { id },
      data,
    })
    res.status(200).json(updatedRule)
  } catch (error) {
    logger.error(`Error updating alert rule ${req.params.id}:`, error)
    next(error)
  }
})


router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.alertRule.delete({ where: { id } })
    res.status(204).end()
  } catch (error) {
    logger.error(`Error deleting alert rule ${req.params.id}:`, error)
    next(error)
  }
})

export { router as alertRulesRouter }