import axios from "axios"

// API Base URLs for different services
const API_URLS = {
  users: import.meta.env.VITE_USERS_API_URL || "http://localhost:3001/api/users",
  monitoring: import.meta.env.VITE_MONITORING_API_URL || "http://localhost:3002/api/monitoring",
  ai: import.meta.env.VITE_AI_API_URL || "http://localhost:3003/api/ai",
  notifications: import.meta.env.VITE_NOTIFICATIONS_API_URL || "http://localhost:3004/api/notifications",
}

// Create axios instances for each service
export const usersApi = axios.create({
  baseURL: API_URLS.users,
  timeout: 10000,
})

export const monitoringApi = axios.create({
  baseURL: API_URLS.monitoring,
  timeout: 10000,
})

export const aiApi = axios.create({
  baseURL: API_URLS.ai,
  timeout: 30000, // Longer timeout for AI operations
})

export const notificationsApi = axios.create({
  baseURL: API_URLS.notifications,
  timeout: 10000,
})

// Request interceptor to add auth token
import type { AxiosInstance } from "axios";

const addAuthInterceptor = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error),
  )
}

// Response interceptor for error handling
const addResponseInterceptor = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
      return Promise.reject(error)
    },
  )
}

// Apply interceptors to all API instances
;[usersApi, monitoringApi, aiApi, notificationsApi].forEach((api) => {
  addAuthInterceptor(api)
  addResponseInterceptor(api)
})
