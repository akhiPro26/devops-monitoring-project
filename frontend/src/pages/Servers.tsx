"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { serversAPI, teamsAPI } from "../services/api"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { Server as ServerType, Team } from "../types"

const Servers: React.FC = () => {
  const [servers, setServers] = useState<ServerType[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingServer, setEditingServer] = useState<ServerType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    ipAddress: "",
    environment: "DEVELOPMENT",
    description: "",
    teamId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [serversRes, teamsRes] = await Promise.all([serversAPI.getAll(), teamsAPI.getMyTeams()])
      setServers(serversRes.data.servers || serversRes.data)
      setTeams(teamsRes.data.teams || teamsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("hello")
    console.log(formData);
    try {
      if (editingServer) {
        await serversAPI.update(editingServer.id, formData)
      } else {
        await serversAPI.create(formData)
      }
      await fetchData()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error("Error saving server:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this server?")) {
      try {
        await serversAPI.delete(id)
        await fetchData()
      } catch (error) {
        console.error("Error deleting server:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      hostname: "",
      ipAddress: "",
      environment: "DEVELOPMENT",
      description: "",
      teamId: "",
    })
    setEditingServer(null)
  }

  const openEditModal = (server: ServerType) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      hostname: server.hostname,
      ipAddress: server.ipAddress,
      environment: server.environment,
      description: server.description,
      teamId: server.teamId,
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Servers</h1>
          <p className="text-gray-600">Manage your server infrastructure</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </button>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <div key={server.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="h-8 w-8 text-blue-600 mr-3"></span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{server.name}</h3>
                  <p className="text-sm text-gray-500">{server.hostname}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEditModal(server)} className="text-gray-400 hover:text-blue-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(server.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">IP Address:</span>
                <span className="text-sm text-gray-900">{server.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Environment:</span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    server.environment === "PRODUCTION"
                      ? "bg-red-100 text-red-800"
                      : server.environment === "STAGING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {server.environment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span
                  className={`text-sm px-2 py-1 rounded-full ${
                    server.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : server.status === "MAINTENANCE"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {server.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Team:</span>
                <span className="text-sm text-gray-900">{server.team.name}</span>
              </div>
            </div>

            {server.description && <p className="mt-4 text-sm text-gray-600">{server.description}</p>}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingServer ? "Edit Server" : "Add New Server"}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PRODUCTION">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingServer ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Servers
