import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Activity, Server, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Zap } from "lucide-react"

export const DashboardPage: React.FC = () => {
  // Mock data - will be replaced with real API calls
  const stats = {
    totalServers: 24,
    onlineServers: 22,
    activeAlerts: 3,
    resolvedToday: 12,
  }

  const recentAlerts = [
    {
      id: "1",
      server: "web-server-01",
      type: "High CPU Usage",
      severity: "HIGH" as const,
      time: "2 minutes ago",
    },
    {
      id: "2",
      server: "db-server-02",
      type: "Memory Warning",
      severity: "MEDIUM" as const,
      time: "15 minutes ago",
    },
    {
      id: "3",
      server: "api-server-03",
      type: "Disk Space Low",
      severity: "LOW" as const,
      time: "1 hour ago",
    },
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your infrastructure health and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Servers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onlineServers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.onlineServers / stats.totalServers) * 100).toFixed(1)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +3 from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health Overview</span>
            </CardTitle>
            <CardDescription>Real-time status of your critical infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-muted rounded-full">
                    <div className="w-16 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">67%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-muted rounded-full">
                    <div className="w-20 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">83%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-muted rounded-full">
                    <div className="w-12 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network I/O</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-muted rounded-full">
                    <div className="w-8 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">32%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Recent Alerts</span>
            </CardTitle>
            <CardDescription>Latest alerts from your monitored systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(alert.severity) as any}>{alert.severity}</Badge>
                      <span className="text-sm font-medium">{alert.type}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Server className="h-3 w-3" />
                      <span>{alert.server}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {alert.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts for managing your infrastructure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Add Server</h3>
                  <p className="text-sm text-muted-foreground">Monitor a new server</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium">Create Alert Rule</h3>
                  <p className="text-sm text-muted-foreground">Set up monitoring alerts</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium">View Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate system reports</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
