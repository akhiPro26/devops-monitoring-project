"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import type { Alert } from "../../types"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, CheckCircle, Clock, Server, MoreVertical, Eye, Check, Trash2, ExternalLink } from "lucide-react"

interface AlertCardProps {
  alert: Alert
  onStatusChange: (id: string, status: Alert["status"]) => void
  onDelete: (id: string) => void
  onView?: (alert: Alert) => void
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onStatusChange, onDelete, onView }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "destructive"
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "ACKNOWLEDGED":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-red-600"
      case "ACKNOWLEDGED":
        return "text-yellow-600"
      case "RESOLVED":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const handleStatusChange = async (newStatus: Alert["status"]) => {
    setIsUpdating(true)
    try {
      await onStatusChange(alert.id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    // Return appropriate icon based on alert type
    return <Server className="h-4 w-4" />
  }

  return (
    <Card
      className={`transition-all hover:shadow-md ${alert.status === "ACTIVE" ? "border-l-4 border-l-red-500" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-muted rounded-lg">{getTypeIcon(alert.type)}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg">{alert.title}</CardTitle>
                <Badge variant={getSeverityColor(alert.severity) as any}>{alert.severity}</Badge>
              </div>
              <CardDescription className="flex items-center space-x-2">
                {getStatusIcon(alert.status)}
                <span className={getStatusColor(alert.status)}>{alert.status}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(alert)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {alert.status === "ACTIVE" && (
                <DropdownMenuItem onClick={() => handleStatusChange("ACKNOWLEDGED")}>
                  <Clock className="h-4 w-4 mr-2" />
                  Acknowledge
                </DropdownMenuItem>
              )}
              {alert.status !== "RESOLVED" && (
                <DropdownMenuItem onClick={() => handleStatusChange("RESOLVED")}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark Resolved
                </DropdownMenuItem>
              )}
              {alert.status === "ACKNOWLEDGED" && (
                <DropdownMenuItem onClick={() => handleStatusChange("ACTIVE")}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(alert.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{alert.message}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Server className="h-3 w-3" />
              <span>{alert.serverId}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Type: {alert.type.replace("_", " ")}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {alert.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("ACKNOWLEDGED")}
                disabled={isUpdating}
              >
                <Clock className="h-3 w-3 mr-1" />
                Acknowledge
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onView?.(alert)}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
