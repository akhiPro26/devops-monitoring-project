"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useMonitoring } from "../context/MonitoringContext"
import { RealTimeMetrics } from "../components/monitoring/RealTimeMetrics"
import { MetricsChart } from "../components/monitoring/MetricsChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { TrendingUp, AlertTriangle, Clock } from "lucide-react"

export const MonitoringPage: React.FC = () => {
  const { metrics, alerts, fetchMetrics, isLoading, error } = useMonitoring()
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h")
  const [selectedServer, setSelectedServer] = useState<string>("all")

  useEffect(() => {
    fetchMetrics(selectedServer === "all" ? undefined : selectedServer, selectedTimeRange)
  }, [selectedTimeRange, selectedServer])

  // Mock data for demonstration
  const mockMetrics = [
    {
      id: "1",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 45.2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "2",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 48.7,
      timestamp: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "3",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 52.1,
      timestamp: new Date(Date.now() - 2400000).toISOString(),
    },
    {
      id: "4",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 47.8,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "5",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 44.3,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "6",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 46.9,
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "7",
      serverId: "server-1",
      type: "CPU_USAGE" as const,
      value: 43.5,
      timestamp: new Date().toISOString(),
    },
    // Memory metrics
    {
      id: "8",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 67.8,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "9",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 69.2,
      timestamp: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "10",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 71.5,
      timestamp: new Date(Date.now() - 2400000).toISOString(),
    },
    {
      id: "11",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 68.9,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "12",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 66.4,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "13",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 70.1,
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "14",
      serverId: "server-1",
      type: "MEMORY_USAGE" as const,
      value: 65.7,
      timestamp: new Date().toISOString(),
    },
  ]

  const displayMetrics = metrics.length > 0 ? metrics : mockMetrics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Real-time system monitoring and performance analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Servers</SelectItem>
              <SelectItem value="server-1">Server 1</SelectItem>
              <SelectItem value="server-2">Server 2</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {/* Real-time Metrics */}
      <RealTimeMetrics />

      {/* Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Historical Metrics</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <MetricsChart
            metrics={displayMetrics}
            title="CPU Usage"
            description="Processor utilization over time"
            metricType="CPU_USAGE"
            color="#3b82f6"
            unit="%"
          />
          <MetricsChart
            metrics={displayMetrics}
            title="Memory Usage"
            description="RAM utilization over time"
            metricType="MEMORY_USAGE"
            color="#10b981"
            unit="%"
          />
        </div>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Recent Alerts</span>
          </CardTitle>
          <CardDescription>Latest system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No active alerts</h3>
              <p className="text-muted-foreground">Your systems are running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          alert.severity === "CRITICAL"
                            ? "destructive"
                            : alert.severity === "HIGH"
                              ? "destructive"
                              : alert.severity === "MEDIUM"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
