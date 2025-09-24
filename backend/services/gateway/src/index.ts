import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { createProxyMiddleware, Options } from "http-proxy-middleware"
import { authenticateToken, requireRole } from "./middleware/auth"
import { apiLimiter, authLimiter, strictLimiter } from "./middleware/rateLimiter"
import { Request, Response } from "express"
import winston from "winston"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  }),
)

app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  })
  next()
})

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Gateway service is healthy",
    timestamp: new Date().toISOString(),
    services: {
      user: process.env.USER_SERVICE_URL,
      monitoring: process.env.MONITORING_SERVICE_URL,
      ai: process.env.AI_SERVICE_URL,
      notification: process.env.NOTIFICATION_SERVICE_URL,
    },
  })
})

// Service proxies with authentication and rate limiting
app.use(
  "/api/auth",
  authLimiter,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api": "",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("User service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "User service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/users",
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/users": "/api/users",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("User service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "User service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/teams",
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/teams": "/teams",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("User service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "User service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/servers",
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/servers": "/servers",   // <--- important
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("User service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "User service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/monitoring", 
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.MONITORING_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
      "^/api/monitoring": "/api",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("Monitoring service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "Monitoring service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/ai",
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.AI_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
      "^/api/ai": "",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("AI service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "AI service unavailable" });
      }
    },
  } as Options)
);

app.use(
  "/api/notifications",
  apiLimiter,
  authenticateToken,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    pathRewrite: {
      "^/api/notifications": "",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("Notification service proxy error:", { message: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.status(503).json({ success: false, error: "Notification service unavailable" });
      }
    },
  } as Options)
);

// Admin routes with strict rate limiting
app.use(
  "/api/admin",
  strictLimiter,
  authenticateToken,
  requireRole(["admin"]),
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/admin": "/api/admin",
    },
    onError(err:any, req: Request, res: Response) {
      logger.error("Admin service proxy error:", { message: err.message, stack: err.stack });
      if(!res.headersSent){
          res.status(503).json({ success: false, error: "Admin service unavailable" });
      }
    },
  } as Options)
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error("Gateway error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})
app.use(express.json({ limit: "10mb" }))

app.listen(PORT, () => {
  logger.info(`Gateway service running on port ${PORT}`)
  logger.info("Service endpoints:", {
    user: process.env.USER_SERVICE_URL,
    monitoring: process.env.MONITORING_SERVICE_URL,
    ai: process.env.AI_SERVICE_URL,
    notification: process.env.NOTIFICATION_SERVICE_URL,
  })
})
