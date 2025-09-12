import axios from "axios"
import { logger } from "../../util/logger"

export class WebhookProvider {
  async send(data: { url: string; payload: Record<string, any> }) {
    try {
      const response = await axios.post(data.url, data.payload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "DevOps-Monitor-Webhook/1.0",
        },
      })

      return { success: true, statusCode: response.status }
    } catch (error:any) {
      logger.error("Error sending webhook:", error)
      return { success: false, error: error.message }
    }
  }
}
