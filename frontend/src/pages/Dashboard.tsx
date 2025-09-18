"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { monitoringAPI } from "../services/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Server, AlertTriangle, Activity, HardDrive } from "lucide-react"
import type { Metric, Alert } from "../types"

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeAlerts, setActiveAlerts] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, alertsRes, activeAlertsRes] = await Promise.all([
          monitoringAPI.getMetrics(),
          monitoringAPI.getAlerts(),
          monitoringAPI.getActiveAlerts(),
        ])

        console.log(metricsRes)

        setMetrics(metricsRes.data)
        setAlerts(alertsRes.data)
        setActiveAlerts(activeAlertsRes.data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const cpuMetrics = metrics.filter((m) => m.type === "CPU_USAGE").slice(0, 10)
  const memoryMetrics = metrics.filter((m) => m.type === "MEMORY_USAGE").slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Monitor your infrastructure at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Server className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Servers</p>
              <p className="text-2xl font-bold text-gray-900">{new Set(metrics.map((m) => m.serverId)).size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{activeAlerts.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg CPU Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {cpuMetrics.length > 0
                  ? `${(cpuMetrics.reduce((acc, m) => acc + m.value, 0) / cpuMetrics.length).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <HardDrive className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Memory Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {memoryMetrics.length > 0
                  ? `${(memoryMetrics.reduce((acc, m) => acc + m.value, 0) / memoryMetrics.length).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CPU Usage Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cpuMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "CPU Usage"]}
              />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memoryMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Memory Usage"]}
              />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-3 ${
                      alert.severity === "CRITICAL"
                        ? "bg-red-500"
                        : alert.severity === "HIGH"
                          ? "bg-orange-500"
                          : alert.severity === "MEDIUM"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-500">{alert.server.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${alert.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`}>
                    {alert.status}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
