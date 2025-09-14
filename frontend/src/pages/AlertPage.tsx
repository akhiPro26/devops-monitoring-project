"use client"

import type React from "react"
import { useState } from "react"
import { useAlerts } from "../context/AlertContext"
import { AlertCard } from "../components/alerts/AlertCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import type { Alert } from "../types"
import { AlertTriangle, Search, RefreshCw, CheckCircle, Clock, XCircle, Activity } from "lucide-react"

export const AlertsPage: React.FC = () => {
  const {
    filteredAlerts,
    isLoading,
    error,
    stats,
    filters,
    fetchAlerts,
    updateAlertStatus,
    deleteAlert,
    setFilters,
    clearError,
  } = useAlerts()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    // In a real app, this would trigger a search API call
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value })
  }

  const handleRefresh = async () => {
    await fetchAlerts()
  }

  const handleBulkAction = (action: string) => {
    // Implement bulk actions like acknowledge all, resolve all, etc.
    console.log(`Bulk action: ${action}`)
  }

  const searchFilteredAlerts = filteredAlerts.filter(
    (alert) =>
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.serverId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading && filteredAlerts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Monitor and manage system alerts and notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => handleBulkAction("acknowledge_all")} disabled={stats.active === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Acknowledge All
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Acknowledged</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Alerts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert Severity Breakdown</CardTitle>
          <CardDescription>Distribution of alerts by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">Critical</Badge>
              <span className="text-sm font-medium">{stats.critical}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">High</Badge>
              <span className="text-sm font-medium">{stats.high}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Medium</Badge>
              <span className="text-sm font-medium">{stats.medium}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Low</Badge>
              <span className="text-sm font-medium">{stats.low}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.severity} onValueChange={(value) => handleFilterChange("severity", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.serverId} onValueChange={(value) => handleFilterChange("serverId", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Server" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Servers</SelectItem>
            <SelectItem value="server-1">Server 1</SelectItem>
            <SelectItem value="server-2">Server 2</SelectItem>
            <SelectItem value="server-3">Server 3</SelectItem>
            <SelectItem value="server-4">Server 4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      {searchFilteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filters.status !== "all" || filters.severity !== "all" || filters.serverId !== "all"
                ? "No alerts match your current filters."
                : "No alerts to display. Your systems are running smoothly!"}
            </p>
            {(searchTerm || filters.status !== "all" || filters.severity !== "all" || filters.serverId !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilters({ status: "all", severity: "all", serverId: "all" })
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {searchFilteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={updateAlertStatus}
              onDelete={deleteAlert}
              onView={setSelectedAlert}
            />
          ))}
        </div>
      )}
    </div>
  )
}
