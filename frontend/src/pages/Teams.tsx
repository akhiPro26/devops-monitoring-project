"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { teamsAPI } from "../services/api"
import type { Team } from "../types"

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getMyTeams()
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await teamsAPI.create(formData)
      setFormData({ name: "", description: "" })
      setShowCreateForm(false)
      fetchTeams()
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await teamsAPI.delete(teamId)
        fetchTeams()
      } catch (error) {
        console.error("Error deleting team:", error)
      }
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Create Team
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div key={team.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
              <button onClick={() => handleDeleteTeam(team.id)} className="text-red-600 hover:text-red-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">{team.description}</p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Creator:</span>
                <span className="ml-1">{team.creator.username}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Members:</span>
                <span className="ml-1">{team.members?.length || 0}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Servers:</span>
                <span className="ml-1">{team.servers?.length || 0}</span>
              </div>
            </div>

            {team.members && team.members.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                <div className="space-y-1">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex justify-between items-center text-sm">
                      <span>{member.user.username}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          member.role === "OWNER"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No teams found</div>
          <p className="text-gray-400 mt-2">Create your first team to get started</p>
        </div>
      )}
    </div>
  )
}

export default Teams
