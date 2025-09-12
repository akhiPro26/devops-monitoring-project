import { HttpClient } from "./httpClient"
import { CircuitBreaker } from "./circuitBreaker"
import { logger } from "./logger"

export interface ServiceConfig {
  name: string
  url: string
  healthEndpoint?: string
  timeout?: number
}

export class ServiceRegistry {
  private services = new Map<string, HttpClient>()
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private healthChecks = new Map<string, boolean>()

  constructor(private configs: ServiceConfig[]) {
    this.initializeServices()
    this.startHealthChecks()
  }

  private initializeServices() {
    for (const config of this.configs) {
      const client = new HttpClient(config.url, config.name, config.timeout)
      const circuitBreaker = new CircuitBreaker()

      this.services.set(config.name, client)
      this.circuitBreakers.set(config.name, circuitBreaker)
      this.healthChecks.set(config.name, true)
    }
  }

  getService(serviceName: string): HttpClient | undefined {
    return this.services.get(serviceName)
  }

  async callService<T>(
    serviceName: string,
    operation: (client: HttpClient) => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const client = this.services.get(serviceName)
    const circuitBreaker = this.circuitBreakers.get(serviceName)

    if (!client || !circuitBreaker) {
      throw new Error(`Service ${serviceName} not found`)
    }

    return circuitBreaker.execute(() => operation(client), fallback)
  }

  private startHealthChecks() {
    setInterval(async () => {
      for (const config of this.configs) {
        try {
          const client = this.services.get(config.name)
          if (client && config.healthEndpoint) {
            await client.get(config.healthEndpoint)
            this.healthChecks.set(config.name, true)
          }
        } catch (error:any) {
          logger.warn(`Health check failed for ${config.name}:`, error.message)
          this.healthChecks.set(config.name, false)
        }
      }
    }, 30000) // Check every 30 seconds
  }

  getServiceHealth(serviceName: string): boolean {
    return this.healthChecks.get(serviceName) || false
  }

  getAllServicesHealth(): Record<string, boolean> {
    const health: Record<string, boolean> = {}
    for (const [name, isHealthy] of this.healthChecks) {
      health[name] = isHealthy
    }
    return health
  }
}
