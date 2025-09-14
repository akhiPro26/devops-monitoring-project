"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import type { Server, MetricSummary } from "../../types"
import { monitoringApi } from "../../lib/api"
import { formatUptime, formatBytes } from "../../lib/utils"
import {
  Activity,
  ServerIcon,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CheckCircle,
  AlertTriangle,
  Settings,
  Trash2,
} from "lucide-react"

interface ServerDetailsDialogProps {
  server: Server
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ServerDetailsDialog: React.FC<ServerDetailsDialogProps> = ({ server, open, onOpenChange }) => {
  const [metrics, setMetrics] = useState<MetricSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && server.id) {
      fetchMetrics()
    }
  }, [open, server.id])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await monitoringApi.get(`/metrics/summary/${server.id}`)
      setMetrics(response.data)
    } catch (error) {
      console.error("Failed to fetch server metrics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "text-green-600"
      case "OFFLINE":
        return "text-red-600"
      case "MAINTENANCE":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ONLINE":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "OFFLINE":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "MAINTENANCE":
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case "PRODUCTION":
        return "destructive"
      case "STAGING":
        return "secondary"
      case "DEVELOPMENT":
        return "outline"
      default:
        return "outline"
    }
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ServerIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{server.name}</DialogTitle>
              <DialogDescription className="flex items-center space-x-2 mt-1">
                {getStatusIcon(server.status)}
                <span>{server.status}</span>
                <Badge variant={getEnvironmentColor(server.environment) as any}>{server.environment}</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Server Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Server Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hostname</p>
                  <p className="font-mono">{server.hostname}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-mono">{server.ipAddress}</p>
                </div>
                {server.port && (
                  <div>
                    <p className="text-sm text-muted-foreground">Port</p>
                    <p className="font-mono">{server.port}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <Badge variant={getEnvironmentColor(server.environment) as any}>{server.environment}</Badge>
                </div>
              </div>
              {server.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{server.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Metrics */}
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-2 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : metrics ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Metrics</span>
                </CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">CPU Usage</span>
                      </div>
                      <span className={`text-sm font-medium ${getUsageColor(metrics.cpuUsage)}`}>
                        {metrics.cpuUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-2 rounded-full ${getUsageBarColor(metrics.cpuUsage)}`}
                        style={{ width: `${metrics.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MemoryStick className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Memory Usage</span>
                      </div>
                      <span className={`text-sm font-medium ${getUsageColor(metrics.memoryUsage)}`}>
                        {metrics.memoryUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-2 rounded-full ${getUsageBarColor(metrics.memoryUsage)}`}
                        style={{ width: `${metrics.memoryUsage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Disk Usage</span>
                      </div>
                      <span className={`text-sm font-medium ${getUsageColor(metrics.diskUsage)}`}>
                        {metrics.diskUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div
                        className={`h-2 rounded-full ${getUsageBarColor(metrics.diskUsage)}`}
                        style={{ width: `${metrics.diskUsage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Load Average</span>
                      </div>
                      <span className="text-sm font-medium">{metrics.loadAverage.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="font-medium">{formatUptime(metrics.uptime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Network In</p>
                      <p className="font-medium">{formatBytes(metrics.networkIn)}/s</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Network Out</p>
                      <p className="font-medium">{formatBytes(metrics.networkOut)}/s</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No metrics available for this server.</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
