import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { logger } from "../utils/logger"

export interface ServiceRequest extends Request {
  service?: {
    name: string
    permissions: string[]
  }
}

export const authenticateService = (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["x-service-auth"]
    const token = Array.isArray(authHeader) ? authHeader[0] : authHeader

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Service authentication required",
      })
    }

    const decoded = jwt.verify(token, process.env.SERVICE_SECRET || "service-secret") as any
    req.service = decoded

    logger.info(`Service authenticated: ${decoded.name}`)
    return next()  // <-- add return here
  } catch (error) {
    logger.error("Service authentication failed:", error)
    return res.status(403).json({
      success: false,
      error: "Invalid service token",
    })
  }
}


export const requireServicePermission = (permission: string) => {
  return (req: ServiceRequest, res: Response, next: NextFunction) => {
    if (!req.service) {
      return res.status(401).json({
        success: false,
        error: "Service authentication required",
      })
    }

    if (!req.service.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Service permission required: ${permission}`,
      })
    }

    return next() // <-- add return here
  }
}

export const generateServiceToken = (serviceName: string, permissions: string[]): string => {
  return jwt.sign(
    {
      name: serviceName,
      permissions,
      type: "service",
    },
    process.env.SERVICE_SECRET || "service-secret",
    { expiresIn: "24h" },
  )
}
