"use client"

import type React from "react"
import { useState } from "react"
import { useServers } from "../../context/ServerContext"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import type { Server } from "../../types"

interface AddServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AddServerDialog: React.FC<AddServerDialogProps> = ({ open, onOpenChange }) => {
  const { addServer } = useServers()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    ipAddress: "",
    port: "",
    environment: "" as Server["environment"],
    description: "",
    teamId: "default-team", // This would come from user context in real app
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Server name is required"
    if (!formData.hostname.trim()) newErrors.hostname = "Hostname is required"
    if (!formData.ipAddress.trim()) newErrors.ipAddress = "IP address is required"
    if (!formData.environment) newErrors.environment = "Environment is required"

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (formData.ipAddress && !ipRegex.test(formData.ipAddress)) {
      newErrors.ipAddress = "Please enter a valid IP address"
    }

    // Port validation
    if (formData.port && (isNaN(Number(formData.port)) || Number(formData.port) < 1 || Number(formData.port) > 65535)) {
      newErrors.port = "Port must be between 1 and 65535"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const serverData = {
        ...formData,
        port: formData.port ? Number(formData.port) : undefined,
        status: "UNKNOWN" as const,
      }

      await addServer(serverData)
      onOpenChange(false)
      setFormData({
        name: "",
        hostname: "",
        ipAddress: "",
        port: "",
        environment: "" as Server["environment"],
        description: "",
        teamId: "default-team",
      })
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
          <DialogDescription>Add a new server to your monitoring infrastructure.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name *</Label>
              <Input
                id="name"
                placeholder="web-server-01"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname *</Label>
              <Input
                id="hostname"
                placeholder="web01.example.com"
                value={formData.hostname}
                onChange={(e) => handleInputChange("hostname", e.target.value)}
                className={errors.hostname ? "border-destructive" : ""}
              />
              {errors.hostname && <p className="text-sm text-destructive">{errors.hostname}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.100"
                value={formData.ipAddress}
                onChange={(e) => handleInputChange("ipAddress", e.target.value)}
                className={errors.ipAddress ? "border-destructive" : ""}
              />
              {errors.ipAddress && <p className="text-sm text-destructive">{errors.ipAddress}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="22"
                value={formData.port}
                onChange={(e) => handleInputChange("port", e.target.value)}
                className={errors.port ? "border-destructive" : ""}
              />
              {errors.port && <p className="text-sm text-destructive">{errors.port}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environment *</Label>
            <Select value={formData.environment} onValueChange={(value) => handleInputChange("environment", value)}>
              <SelectTrigger className={errors.environment ? "border-destructive" : ""}>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEVELOPMENT">Development</SelectItem>
                <SelectItem value="STAGING">Staging</SelectItem>
                <SelectItem value="PRODUCTION">Production</SelectItem>
              </SelectContent>
            </Select>
            {errors.environment && <p className="text-sm text-destructive">{errors.environment}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Web server for main application"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
