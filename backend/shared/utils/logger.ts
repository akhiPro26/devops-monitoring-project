import winston from "winston"

const createLogger = (serviceName: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: service || serviceName,
          message,
          ...meta,
        })
      }),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.File({ filename: "logs/error.log", level: "error" }),
      new winston.transports.File({ filename: "logs/combined.log" }),
    ],
  })
}

// Default logger
export const logger = createLogger("shared")

// Service-specific logger factory
export const createServiceLogger = (serviceName: string) => {
  const serviceLogger = createLogger(serviceName)

  if (process.env.NODE_ENV !== "production") {
    serviceLogger.add(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    )
  }

  return serviceLogger
}
