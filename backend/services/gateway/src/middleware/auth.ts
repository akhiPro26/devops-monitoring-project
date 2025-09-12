import axios from "axios"
import type { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    teamId?: string
  }
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      })
    }

    // Verify token with user service
    const response = await axios.get(`${process.env.USER_SERVICE_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    req.user = response.data.user
    next()
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
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

    next()
  }
}
