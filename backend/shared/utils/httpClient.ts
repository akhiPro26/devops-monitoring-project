import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import { logger } from "./logger"

export class HttpClient {
  private client: AxiosInstance
  private serviceName: string

  constructor(baseURL: string, serviceName: string, timeout = 10000) {
    this.serviceName = serviceName
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `DevOps-Monitor-${serviceName}/1.0`,
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`[${this.serviceName}] HTTP Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error(`[${this.serviceName}] Request Error:`, error)
        return Promise.reject(error)
      },
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.info(
          `[${this.serviceName}] HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        )
        return response
      },
      (error) => {
        const status = error.response?.status || "Unknown"
        const method = error.config?.method?.toUpperCase() || "Unknown"
        const url = error.config?.url || "Unknown"

        logger.error(`[${this.serviceName}] HTTP Error: ${status} ${method} ${url}`, {
          error: error.message,
          response: error.response?.data,
        })

        return Promise.reject(error)
      },
    )
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config)
    return response.data
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  removeAuthToken() {
    delete this.client.defaults.headers.common["Authorization"]
  }
}
