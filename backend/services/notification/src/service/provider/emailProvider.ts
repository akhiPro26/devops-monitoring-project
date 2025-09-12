import nodemailer from "nodemailer"
import { logger } from "../../util/logger"

export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
  }

  async send(data: { to: string; subject: string; content: string; metadata?: Record<string, any> }) {
    try {
      if (this.transporter) {
        return await this.sendWithSMTP(data)
      } else {
        throw new Error("No email provider configured - please set SMTP credentials")
      }
    } catch (error:any) {
      logger.error("Error sending email:", error)
      return { success: false, error: error.message }
    }
  }

  private async sendWithSMTP(data: { to: string; subject: string; content: string }) {
    try {
      await this.transporter!.sendMail({
        from: process.env.FROM_EMAIL || "noreply@devops-monitor.com",
        to: data.to,
        subject: data.subject,
        html: data.content,
      })

      return { success: true }
    } catch (error) {
      throw error
    }
  }
}
