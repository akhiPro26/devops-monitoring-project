import { z } from "zod"

export const serverValidation = {
  create: z.object({
    name: z.string().min(1, "Server name is required"),
    hostname: z.string().min(1, "Hostname is required"),
    ipAddress: z.string().refine((val) => {
    // IPv4 regex pattern
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // IPv6 regex pattern (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(val) || ipv6Regex.test(val)
  }, {
    message: "Invalid IP address format"
  }),
    port: z.number().int().min(1).max(65535).optional().default(22),
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    hostname: z.string().min(1).optional(),
    ipAddress: z.string().refine((val) => {
    // IPv4 regex pattern
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // IPv6 regex pattern (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(val) || ipv6Regex.test(val)
  }, {
    message: "Invalid IP address format"
  }),
    port: z.number().int().min(1).max(65535).optional(),
    status: z.enum(["ONLINE", "OFFLINE", "UNKNOWN", "MAINTENANCE"]).optional(),
  }),
}

export const metricsValidation = {
  query: z.object({
    serverId: z.string().optional(),
    type: z
      .enum(["CPU_USAGE", "MEMORY_USAGE", "DISK_USAGE", "NETWORK_IN", "NETWORK_OUT", "LOAD_AVERAGE", "UPTIME"])
      .optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
  }),
}

export const alertValidation = {
  query: z.object({
    serverId: z.string().optional(),
    status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]).optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  }),

  update: z.object({
    status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]),
  }),

  rule: z.object({
    name: z.string().min(1),
    metricType: z.enum([
      "CPU_USAGE",
      "MEMORY_USAGE",
      "DISK_USAGE",
      "NETWORK_IN",
      "NETWORK_OUT",
      "LOAD_AVERAGE",
      "UPTIME",
    ]),
    condition: z.enum(["greater_than", "less_than", "equals"]),
    threshold: z.number().min(0),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    enabled: z.boolean().optional().default(true),
  }),
}
