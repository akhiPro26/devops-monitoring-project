"use client"

import type React from "react"
import { useState } from "react"
import { useServers } from "../context/ServerContext"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { AddServerDialog } from "../components/servers/AddServerDialog"
import { ServerDetailsDialog } from "../components/servers/ServerDetailsDialog"
import type { Server } from "../types"
import {
  ServerIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Trash2,
} from "lucide-react"

export const ServersPage: React.FC = () => {
  const { servers, isLoading, error } = useServers()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.ipAddress.includes(searchTerm),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-green-500"
      case "OFFLINE":
        return "bg-red-500"
      case "MAINTENANCE":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ONLINE":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "OFFLINE":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "MAINTENANCE":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
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

  const handleServerClick = (server: Server) => {
    setSelectedServer(server)
    setShowDetailsDialog(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Servers</h1>
          <p className="text-muted-foreground">Loading servers...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
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
          <h1 className="text-3xl font-bold text-foreground">Servers</h1>
          <p className="text-muted-foreground">Manage and monitor your infrastructure servers</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Server</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Servers</p>
                <p className="text-2xl font-bold">{servers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {servers.filter((s) => s.status === "ONLINE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {servers.filter((s) => s.status === "OFFLINE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {servers.filter((s) => s.status === "MAINTENANCE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Servers Grid */}
      {filteredServers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ServerIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No servers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No servers match your search criteria." : "Get started by adding your first server."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Server
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServers.map((server) => (
            <Card key={server.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></div>
                    <CardTitle className="text-lg">{server.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  {getStatusIcon(server.status)}
                  <span>{server.status}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" onClick={() => handleServerClick(server)}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hostname</span>
                    <span className="font-mono">{server.hostname}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">IP Address</span>
                    <span className="font-mono">{server.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Environment</span>
                    <Badge variant={getEnvironmentColor(server.environment) as any}>{server.environment}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>CPU: 45%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span>RAM: 67%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddServerDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      {selectedServer && (
        <ServerDetailsDialog server={selectedServer} open={showDetailsDialog} onOpenChange={setShowDetailsDialog} />
      )}
    </div>
  )
}
