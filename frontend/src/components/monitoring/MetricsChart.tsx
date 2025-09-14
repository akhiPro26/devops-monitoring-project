"use client"

import type React from "react"
import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import type { Metric } from "../../types"
import { format } from "date-fns"

interface MetricsChartProps {
  metrics: Metric[]
  title: string
  description?: string
  metricType: string
  color?: string
  unit?: string
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  metrics,
  title,
  description,
  metricType,
  color = "#6366f1",
  unit = "%",
}) => {
  const chartData = useMemo(() => {
    return metrics
      .filter((metric) => metric.type === metricType)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((metric) => ({
        timestamp: metric.timestamp,
        value: metric.value,
        formattedTime: format(new Date(metric.timestamp), "HH:mm"),
      }))
  }, [metrics, metricType])

  const formatValue = (value: number) => {
    if (unit === "bytes") {
      const sizes = ["B", "KB", "MB", "GB", "TB"]
      if (value === 0) return "0 B"
      const i = Math.floor(Math.log(value) / Math.log(1024))
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
    }
    return `${value.toFixed(1)}${unit}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{format(new Date(label), "MMM dd, HH:mm")}</p>
          <p className="text-sm font-medium" style={{ color }}>
            {`${title}: ${formatValue(payload[0].value)}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="formattedTime"
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
