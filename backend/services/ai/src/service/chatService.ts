import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { RAGService } from "./ragService"
import { logger } from "../utils/logger"

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export class ChatService {
  private ragService = new RAGService()

  async processMessage(data: {
    message: string
    sessionId?: string
    userId: string
    context?: Record<string, any>
  }) {
    try {
      let session

      if (data.sessionId) {
        session = await prisma.chatSession.findFirst({
          where: { id: data.sessionId, userId: data.userId },
        })
      }

      if (!session) {
        session = await prisma.chatSession.create({
          data: {
            userId: data.userId,
            title: data.message.substring(0, 50) + "...",
            messages: [],
            context: data.context || {},
          },
        })
      }

      // Get relevant context from RAG
      const ragResponse = await this.ragService.query(data.message, {
        serverId: data.context?.serverId,
      })

      // Prepare conversation history
      const messages = session.messages as any[]
      const conversationHistory = messages.slice(-10) // Last 10 messages

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const conversationContext = conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

      const prompt = `You are a DevOps expert assistant helping with server monitoring and infrastructure management.

Use the following context from the knowledge base:
${ragResponse.answer}

Previous conversation:
${conversationContext}

Current message: ${data.message}

Be helpful, concise, and provide actionable advice. If you don't know something, say so.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const aiResponse = response.text()

      // Update session with new messages
      const updatedMessages = [
        ...messages,
        { role: "user", content: data.message, timestamp: new Date() },
        { role: "assistant", content: aiResponse, timestamp: new Date() },
      ]

      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      })

      return {
        sessionId: session.id,
        response: aiResponse,
        sources: ragResponse.sources,
      }
    } catch (error) {
      logger.error("Error processing chat message:", error)
      throw error
    }
  }
}
