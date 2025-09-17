"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { monitoringAPI } from "../services/api"
import type { Alert } from "../types"

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [activeAlerts, setActiveAlerts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all")

  useEffect(() => {
    fetchAlerts()
    fetchActiveAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await monitoringAPI.getAlerts()
      setAlerts(response.data || [])
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveAlerts = async () => {
    try {
      const response = await monitoringAPI.getActiveAlerts()
      setActiveAlerts(response.data)
    } catch (error) {
      console.error("Error fetching active alerts:", error)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      await monitoringAPI.updateAlert(alertId, { status: "RESOLVED" })
      fetchAlerts()
      fetchActiveAlerts()
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      try {
        await monitoringAPI.deleteAlert(alertId)
        fetchAlerts()
        fetchActiveAlerts()
      } catch (error) {
        console.error("Error deleting alert:", error)
      }
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200"
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "active") return alert.status === "ACTIVE"
    if (filter === "resolved") return alert.status === "RESOLVED"
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "active" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "resolved" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {activeAlerts && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-gray-900">{activeAlerts.total}</div>
            <div className="text-sm text-gray-600">Total Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-red-600">{activeAlerts.critical}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-orange-600">{activeAlerts.high}</div>
            <div className="text-sm text-gray-600">High</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-yellow-600">{activeAlerts.medium}</div>
            <div className="text-sm text-gray-600">Medium</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      alert.status === "ACTIVE" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{alert.type}</h3>
                <p className="text-gray-600 mb-3">{alert.message}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Server:</span>
                    <div className="text-gray-600">{alert.server.name}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Threshold:</span>
                    <div className="text-gray-600">{alert.threshold}%</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Current Value:</span>
                    <div className="text-gray-600">{alert.currentValue.toFixed(2)}%</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="text-gray-600">{new Date(alert.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {alert.resolvedAt && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">Resolved:</span>
                    <span className="text-gray-600 ml-1">{new Date(alert.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {alert.status === "ACTIVE" && (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No alerts found</div>
          <p className="text-gray-400 mt-2">
            {filter === "active"
              ? "No active alerts at the moment"
              : filter === "resolved"
                ? "No resolved alerts found"
                : "No alerts have been generated yet"}
          </p>
        </div>
      )}
    </div>
  )
}

export default Alerts
