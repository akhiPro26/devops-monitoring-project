"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { useMonitoring } from "../../context/MonitoringContext"
import { Activity, Pause, Play, RefreshCw, Cpu, MemoryStick, HardDrive, Network } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number
  unit: string
  icon: React.ReactNode
  color: string
  trend?: "up" | "down" | "stable"
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, color, trend }) => {
  const formatValue = (val: number) => {
    if (unit === "bytes") {
      const sizes = ["B", "KB", "MB", "GB", "TB"]
      if (val === 0) return "0 B"
      const i = Math.floor(Math.log(val) / Math.log(1024))
      return `${(val / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }
    return `${val.toFixed(1)}${unit}`
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-600"
      case "down":
        return "text-green-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
            </div>
          </div>
          {trend && (
            <div className={`text-xs ${getTrendColor()}`}>{trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const RealTimeMetrics: React.FC = () => {
  const { metricsSummary, isRealTimeEnabled, toggleRealTime, fetchMetricsSummary } = useMonitoring()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        setLastUpdate(new Date())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRealTimeEnabled])

  const aggregatedMetrics = Object.values(metricsSummary).reduce(
    (acc, summary) => ({
      avgCpu: acc.avgCpu + summary.cpuUsage / Object.keys(metricsSummary).length,
      avgMemory: acc.avgMemory + summary.memoryUsage / Object.keys(metricsSummary).length,
      avgDisk: acc.avgDisk + summary.diskUsage / Object.keys(metricsSummary).length,
      totalNetworkIn: acc.totalNetworkIn + summary.networkIn,
      totalNetworkOut: acc.totalNetworkOut + summary.networkOut,
    }),
    { avgCpu: 0, avgMemory: 0, avgDisk: 0, totalNetworkIn: 0, totalNetworkOut: 0 },
  )

  const handleRefresh = async () => {
    await fetchMetricsSummary()
    setLastUpdate(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Real-time Monitoring</h2>
          <p className="text-muted-foreground">Live system metrics and performance data</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRealTimeEnabled ? "default" : "outline"} className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>{isRealTimeEnabled ? "Live" : "Paused"}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleRealTime(!isRealTimeEnabled)}
            className="flex items-center space-x-2"
          >
            {isRealTimeEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isRealTimeEnabled ? "Pause" : "Resume"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? "bg-green-500" : "bg-gray-500"}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isRealTimeEnabled ? "Real-time updates active" : "Real-time updates paused"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</div>
            </div>
            <div className="text-sm text-muted-foreground">{Object.keys(metricsSummary).length} servers monitored</div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Average CPU Usage"
          value={aggregatedMetrics.avgCpu}
          unit="%"
          icon={<Cpu className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          trend="stable"
        />
        <MetricCard
          title="Average Memory Usage"
          value={aggregatedMetrics.avgMemory}
          unit="%"
          icon={<MemoryStick className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          trend="up"
        />
        <MetricCard
          title="Average Disk Usage"
          value={aggregatedMetrics.avgDisk}
          unit="%"
          icon={<HardDrive className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-100"
          trend="stable"
        />
        <MetricCard
          title="Network Throughput"
          value={aggregatedMetrics.totalNetworkIn + aggregatedMetrics.totalNetworkOut}
          unit="bytes"
          icon={<Network className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
          trend="down"
        />
      </div>

      {/* Server Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(metricsSummary).map(([serverId, summary]) => (
          <Card key={serverId}>
            <CardHeader>
              <CardTitle className="text-lg">Server {serverId}</CardTitle>
              <CardDescription>Real-time performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">{summary.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${summary.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory</span>
                    <span className="text-sm text-muted-foreground">{summary.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      style={{ width: `${summary.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm text-muted-foreground">{summary.diskUsage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div
                      className="h-2 bg-yellow-500 rounded-full transition-all duration-300"
                      style={{ width: `${summary.diskUsage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Load Avg</span>
                    <span className="text-sm text-muted-foreground">{summary.loadAverage.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
