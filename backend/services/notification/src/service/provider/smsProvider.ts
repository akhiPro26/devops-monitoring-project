import { logger } from "../../util/logger"
import { EmailProvider } from "./emailProvider"

export class SMSProvider {
  private emailProvider = new EmailProvider()

  private carrierGateways = {
    verizon: "@vtext.com",
    att: "@txt.att.net",
    tmobile: "@tmomail.net",
    sprint: "@messaging.sprintpcs.com",
    boost: "@smsmyboostmobile.com",
    cricket: "@sms.cricketwireless.net",
    uscellular: "@email.uscc.net",
  }

  async send(data: { to: string; message: string; carrier?: string; metadata?: Record<string, any> }) {
    try {
      const carrier = data.carrier || "verizon" // Default carrier
      const gateway = this.carrierGateways[carrier as keyof typeof this.carrierGateways]

      if (!gateway) {
        throw new Error(`Unsupported carrier: ${carrier}`)
      }

      // Remove non-numeric characters from phone number
      const phoneNumber = data.to.replace(/\D/g, "")
      const smsEmail = `${phoneNumber}${gateway}`

      // Send SMS via email gateway
      const result = await this.emailProvider.send({
        to: smsEmail,
        subject: "", // SMS gateways ignore subject
        content: data.message,
        metadata: data.metadata,
      })

      return result
    } catch (error:any) {
      logger.error("Error sending SMS:", error)
      return { success: false, error: error.message }
    }
  }

  async sendToAllCarriers(data: { to: string; message: string; metadata?: Record<string, any> }) {
    const phoneNumber = data.to.replace(/\D/g, "")
    const results = []

    for (const [carrier, gateway] of Object.entries(this.carrierGateways)) {
      try {
        const smsEmail = `${phoneNumber}${gateway}`
        const result = await this.emailProvider.send({
          to: smsEmail,
          subject: "",
          content: data.message,
          metadata: { ...data.metadata, carrier },
        })
        results.push({ carrier, success: result.success })
      } catch (error) {
        results.push({ carrier, success: false, error: error.message })
      }
    }

    return { success: true, results }
  }
}
