"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useRef } from "react"
import type { Metric, MetricSummary, Alert } from "../types"
import { monitoringApi } from "../lib/api"

interface MonitoringState {
  metrics: Metric[]
  metricsSummary: Record<string, MetricSummary>
  alerts: Alert[]
  isLoading: boolean
  error: string | null
  isRealTimeEnabled: boolean
}

type MonitoringAction =
  | { type: "FETCH_START" }
  | {
      type: "FETCH_SUCCESS"
      payload: { metrics?: Metric[]; alerts?: Alert[]; summary?: Record<string, MetricSummary> }
    }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "UPDATE_METRICS"; payload: Metric[] }
  | { type: "UPDATE_SUMMARY"; payload: Record<string, MetricSummary> }
  | { type: "UPDATE_ALERTS"; payload: Alert[] }
  | { type: "TOGGLE_REALTIME"; payload: boolean }
  | { type: "CLEAR_ERROR" }

const initialState: MonitoringState = {
  metrics: [],
  metricsSummary: {},
  alerts: [],
  isLoading: false,
  error: null,
  isRealTimeEnabled: true,
}

const monitoringReducer = (state: MonitoringState, action: MonitoringAction): MonitoringState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null }
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        metrics: action.payload.metrics || state.metrics,
        alerts: action.payload.alerts || state.alerts,
        metricsSummary: action.payload.summary || state.metricsSummary,
        error: null,
      }
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "UPDATE_METRICS":
      return { ...state, metrics: action.payload }
    case "UPDATE_SUMMARY":
      return { ...state, metricsSummary: action.payload }
    case "UPDATE_ALERTS":
      return { ...state, alerts: action.payload }
    case "TOGGLE_REALTIME":
      return { ...state, isRealTimeEnabled: action.payload }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface MonitoringContextType extends MonitoringState {
  fetchMetrics: (serverId?: string, timeRange?: string) => Promise<void>
  fetchAlerts: () => Promise<void>
  fetchMetricsSummary: () => Promise<void>
  toggleRealTime: (enabled: boolean) => void
  clearError: () => void
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined)

export const useMonitoring = () => {
  const context = useContext(MonitoringContext)
  if (context === undefined) {
    throw new Error("useMonitoring must be used within a MonitoringProvider")
  }
  return context
}

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(monitoringReducer, initialState)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMetrics = async (serverId?: string, timeRange?: string) => {
    dispatch({ type: "FETCH_START" })
    try {
      const params = new URLSearchParams()
      if (serverId) params.append("serverId", serverId)
      if (timeRange) {
        const now = new Date()
        const from = new Date(now.getTime() - (timeRange === "1h" ? 3600000 : timeRange === "24h" ? 86400000 : 3600000))
        params.append("from", from.toISOString())
        params.append("to", now.toISOString())
      }

      const response = await monitoringApi.get(`/metrics?${params.toString()}`)
      dispatch({ type: "UPDATE_METRICS", payload: response.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch metrics"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await monitoringApi.get("/alerts")
      dispatch({ type: "UPDATE_ALERTS", payload: response.data })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch alerts"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const fetchMetricsSummary = async () => {
    try {
      // This would typically fetch summary for all servers
      // For now, we'll simulate with mock data
      const mockSummary: Record<string, MetricSummary> = {
        "server-1": {
          serverId: "server-1",
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 34.1,
          networkIn: 1024000,
          networkOut: 512000,
          loadAverage: 1.23,
          uptime: 86400,
          lastUpdated: new Date().toISOString(),
        },
        "server-2": {
          serverId: "server-2",
          cpuUsage: 78.9,
          memoryUsage: 89.2,
          diskUsage: 56.7,
          networkIn: 2048000,
          networkOut: 1024000,
          loadAverage: 2.45,
          uptime: 172800,
          lastUpdated: new Date().toISOString(),
        },
      }
      dispatch({ type: "UPDATE_SUMMARY", payload: mockSummary })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch metrics summary"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const toggleRealTime = (enabled: boolean) => {
    dispatch({ type: "TOGGLE_REALTIME", payload: enabled })
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  // Real-time data fetching
  useEffect(() => {
    if (state.isRealTimeEnabled) {
      const fetchData = async () => {
        await Promise.all([fetchMetrics(), fetchAlerts(), fetchMetricsSummary()])
      }

      // Initial fetch
      fetchData()

      // Set up interval for real-time updates
      intervalRef.current = setInterval(fetchData, 30000) // Update every 30 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRealTimeEnabled])

  return (
    <MonitoringContext.Provider
      value={{
        ...state,
        fetchMetrics,
        fetchAlerts,
        fetchMetricsSummary,
        toggleRealTime,
        clearError,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  )
}
