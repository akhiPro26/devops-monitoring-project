import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: error.errors,
    })
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      error: "Duplicate entry",
      field: error.meta?.target,
    })
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
}
