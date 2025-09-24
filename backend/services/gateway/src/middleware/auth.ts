import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    teamId?: string
  }
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]
    console.log("jwt token = ", token)
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      })
    }
    
    const secret = process.env.JWT_SECRET
    console.log("jwt secret = ", secret);

    if (!secret) {
      throw new Error("JWT_SECRET not configured in environment variables")
    }

    const decoded = jwt.verify(token, secret) as AuthenticatedRequest["user"]
    req.user = decoded

    return next() // <-- add return here
  } catch (error: any) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
      details: error.message,
    })
  }
}


export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      })
    }

    return next() // <-- add return here
  }
}

