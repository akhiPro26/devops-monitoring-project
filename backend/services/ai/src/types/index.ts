export interface ServerMetrics {
  cpu: number
  memory: number
  disk: number
  load: number
  network?: {
    in: number
    out: number
  }
}

export interface AlertRule {
  id: string
  name: string
  metricType: MetricType
  condition: "greater_than" | "less_than" | "equals"
  threshold: number
  severity: AlertSeverity
  enabled: boolean
}

export interface HealthCheckResult {
  status: "HEALTHY" | "UNHEALTHY" | "TIMEOUT" | "ERROR"
  latency?: number
  error?: string
  response?: any
}

export type MetricType =
  | "CPU_USAGE"
  | "MEMORY_USAGE"
  | "DISK_USAGE"
  | "NETWORK_IN"
  | "NETWORK_OUT"
  | "LOAD_AVERAGE"
  | "UPTIME"

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type AlertStatus = "ACTIVE" | "RESOLVED" | "ACKNOWLEDGED"

export type ServerStatus = "ONLINE" | "OFFLINE" | "UNKNOWN" | "MAINTENANCE"
