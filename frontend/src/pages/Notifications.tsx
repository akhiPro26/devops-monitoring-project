"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { notificationsAPI } from "../services/api"
import type { Notification, NotificationStats } from "../types"

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    type: "alert",
    title: "",
    message: "",
    recipient: "",
    channelType: "email",
    priority: "medium",
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll()
      setNotifications(response.data.data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await notificationsAPI.getStats()
      setStats(response.data.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await notificationsAPI.send(formData)
      setFormData({
        type: "alert",
        title: "",
        message: "",
        recipient: "",
        channelType: "email",
        priority: "medium",
      })
      setShowSendForm(false)
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  const handleRetryNotification = async (notificationId: string) => {
    try {
      await notificationsAPI.retry(notificationId)
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error("Error retrying notification:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => setShowSendForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send Notification
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-blue-600">{stats.deliveryRate}%</div>
            <div className="text-sm text-gray-600">Delivery Rate</div>
          </div>
        </div>
      )}

      {showSendForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="alert">Alert</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                <input
                  type="email"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={formData.channelType}
                  onChange={(e) => setFormData({ ...formData, channelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="slack">Slack</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Send Notification
              </button>
              <button
                type="button"
                onClick={() => setShowSendForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(notification.status)}`}>
                    {notification.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notification.priority)}`}
                  >
                    {notification.priority}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {notification.channelType}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{notification.title}</h3>
                <p className="text-gray-600 mb-3">{notification.message}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Recipient:</span>
                    <div className="text-gray-600">{notification.recipient}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <div className="text-gray-600">{notification.type}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <div className="text-gray-600">{new Date(notification.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {notification.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <span className="font-medium text-red-800">Error:</span>
                    <div className="text-red-700 text-sm mt-1">{notification.error}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {notification.status === "failed" && (
                  <button
                    onClick={() => handleRetryNotification(notification.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No notifications found</div>
          <p className="text-gray-400 mt-2">Send your first notification to get started</p>
        </div>
      )}
    </div>
  )
}

export default Notifications
