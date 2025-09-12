import type { Request, Response, NextFunction } from "express"
import { logger } from "../util/logger"

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  })

  if (res.headersSent) {
    return next(error)
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  })
}
