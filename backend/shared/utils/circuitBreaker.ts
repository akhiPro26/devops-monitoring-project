import { logger } from "./logger"

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime?: number
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED"
  private options: CircuitBreakerOptions

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
    }
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.state = "HALF_OPEN"
      } else {
        if (fallback) {
          logger.warn("Circuit breaker is OPEN, executing fallback")
          return await fallback()
        }
        throw new Error("Circuit breaker is OPEN")
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      if (fallback) {
        logger.warn("Operation failed, executing fallback")
        return await fallback()
      }
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = "CLOSED"
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN"
      logger.warn(`Circuit breaker opened after ${this.failureCount} failures`)
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== undefined && Date.now() - this.lastFailureTime >= this.options.resetTimeout
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    }
  }
}
