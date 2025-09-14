"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Alert } from "../types"

interface AlertState {
  alerts: Alert[]
  filteredAlerts: Alert[]
  isLoading: boolean
  error: string | null
  filters: {
    status: string
    severity: string
    serverId: string
  }
  stats: {
    total: number
    active: number
    resolved: number
    acknowledged: number
    critical: number
    high: number
    medium: number
    low: number
  }
}

type AlertAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Alert[] }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "UPDATE_ALERT"; payload: Alert }
  | { type: "DELETE_ALERT"; payload: string }
  | { type: "SET_FILTERS"; payload: Partial<AlertState["filters"]> }
  | { type: "CLEAR_ERROR" }

const initialState: AlertState = {
  alerts: [],
  filteredAlerts: [],
  isLoading: false,
  error: null,
  filters: {
    status: "all",
    severity: "all",
    serverId: "all",
  },
  stats: {
    total: 0,
    active: 0,
    resolved: 0,
    acknowledged: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
}

const calculateStats = (alerts: Alert[]) => {
  return alerts.reduce(
    (stats, alert) => ({
      total: stats.total + 1,
      active: stats.active + (alert.status === "ACTIVE" ? 1 : 0),
      resolved: stats.resolved + (alert.status === "RESOLVED" ? 1 : 0),
      acknowledged: stats.acknowledged + (alert.status === "ACKNOWLEDGED" ? 1 : 0),
      critical: stats.critical + (alert.severity === "CRITICAL" ? 1 : 0),
      high: stats.high + (alert.severity === "HIGH" ? 1 : 0),
      medium: stats.medium + (alert.severity === "MEDIUM" ? 1 : 0),
      low: stats.low + (alert.severity === "LOW" ? 1 : 0),
    }),
    { total: 0, active: 0, resolved: 0, acknowledged: 0, critical: 0, high: 0, medium: 0, low: 0 },
  )
}

const applyFilters = (alerts: Alert[], filters: AlertState["filters"]) => {
  return alerts.filter((alert) => {
    if (filters.status !== "all" && alert.status !== filters.status) return false
    if (filters.severity !== "all" && alert.severity !== filters.severity) return false
    if (filters.serverId !== "all" && alert.serverId !== filters.serverId) return false
    return true
  })
}

const alertReducer = (state: AlertState, action: AlertAction): AlertState => {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null }
    case "FETCH_SUCCESS":
      const stats = calculateStats(action.payload)
      const filteredAlerts = applyFilters(action.payload, state.filters)
      return {
        ...state,
        isLoading: false,
        alerts: action.payload,
        filteredAlerts,
        stats,
        error: null,
      }
    case "FETCH_FAILURE":
      return { ...state, isLoading: false, error: action.payload }
    case "UPDATE_ALERT":
      const updatedAlerts = state.alerts.map((alert) => (alert.id === action.payload.id ? action.payload : alert))
      const updatedStats = calculateStats(updatedAlerts)
      const updatedFilteredAlerts = applyFilters(updatedAlerts, state.filters)
      return {
        ...state,
        alerts: updatedAlerts,
        filteredAlerts: updatedFilteredAlerts,
        stats: updatedStats,
      }
    case "DELETE_ALERT":
      const remainingAlerts = state.alerts.filter((alert) => alert.id !== action.payload)
      const remainingStats = calculateStats(remainingAlerts)
      const remainingFilteredAlerts = applyFilters(remainingAlerts, state.filters)
      return {
        ...state,
        alerts: remainingAlerts,
        filteredAlerts: remainingFilteredAlerts,
        stats: remainingStats,
      }
    case "SET_FILTERS":
      const newFilters = { ...state.filters, ...action.payload }
      const newFilteredAlerts = applyFilters(state.alerts, newFilters)
      return {
        ...state,
        filters: newFilters,
        filteredAlerts: newFilteredAlerts,
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface AlertContextType extends AlertState {
  fetchAlerts: () => Promise<void>
  updateAlertStatus: (id: string, status: Alert["status"]) => Promise<void>
  deleteAlert: (id: string) => Promise<void>
  setFilters: (filters: Partial<AlertState["filters"]>) => void
  clearError: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider")
  }
  return context
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, initialState)

  const fetchAlerts = async () => {
    dispatch({ type: "FETCH_START" })
    try {
      // Mock data for demonstration
      const mockAlerts: Alert[] = [
        {
          id: "alert-1",
          serverId: "server-1",
          type: "CPU_USAGE",
          severity: "HIGH",
          status: "ACTIVE",
          title: "High CPU Usage",
          message: "CPU usage has exceeded 85% for the last 10 minutes on web-server-01",
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: "alert-2",
          serverId: "server-2",
          type: "MEMORY_USAGE",
          severity: "CRITICAL",
          status: "ACTIVE",
          title: "Critical Memory Usage",
          message: "Memory usage has reached 95% on database-server-02. Immediate action required.",
          createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          updatedAt: new Date(Date.now() - 900000).toISOString(),
        },
        {
          id: "alert-3",
          serverId: "server-3",
          type: "DISK_USAGE",
          severity: "MEDIUM",
          status: "ACKNOWLEDGED",
          title: "Disk Space Warning",
          message: "Disk usage on /var/log partition has reached 75% on api-server-03",
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: "alert-4",
          serverId: "server-1",
          type: "NETWORK_IO",
          severity: "LOW",
          status: "RESOLVED",
          title: "Network Latency",
          message: "Network latency increased to 150ms on web-server-01",
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "alert-5",
          serverId: "server-4",
          type: "UPTIME",
          severity: "CRITICAL",
          status: "ACTIVE",
          title: "Server Offline",
          message: "Load balancer server-04 is not responding to health checks",
          createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          updatedAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: "alert-6",
          serverId: "server-2",
          type: "CPU_USAGE",
          severity: "MEDIUM",
          status: "RESOLVED",
          title: "CPU Spike",
          message: "CPU usage spiked to 90% during backup process on database-server-02",
          createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]

      dispatch({ type: "FETCH_SUCCESS", payload: mockAlerts })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to fetch alerts"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const updateAlertStatus = async (id: string, status: Alert["status"]) => {
    try {
      // In a real app, this would make an API call
      const alert = state.alerts.find((a) => a.id === id)
      if (alert) {
        const updatedAlert = {
          ...alert,
          status,
          updatedAt: new Date().toISOString(),
        }
        dispatch({ type: "UPDATE_ALERT", payload: updatedAlert })
      }
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to update alert"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      // In a real app, this would make an API call
      dispatch({ type: "DELETE_ALERT", payload: id })
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to delete alert"
      dispatch({ type: "FETCH_FAILURE", payload: message })
    }
  }

  const setFilters = (filters: Partial<AlertState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters })
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  return (
    <AlertContext.Provider
      value={{
        ...state,
        fetchAlerts,
        updateAlertStatus,
        deleteAlert,
        setFilters,
        clearError,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}
