import { PrismaClient } from "@prisma/client"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { logger } from "../utils/logger"

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export class RAGService {
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Simple text-based embedding using character frequency
      // In production, use a proper embedding model like sentence-transformers
      const words = text.toLowerCase().split(/\s+/)
      const embedding = new Array(384).fill(0) // Standard embedding size

      for (let i = 0; i < words.length && i < 384; i++) {
        const word = words[i]
        for (let j = 0; j < word.length && j < 384; j++) {
          embedding[j] += word.charCodeAt(j % word.length) / 1000
        }
      }

      return embedding
    } catch (error) {
      logger.error("Error generating embedding:", error)
      throw new Error("Failed to generate embedding")
    }
  }

  async addDocument(documentData: {
    title: string
    content: string
    source: string
    category: string
    tags?: string[]
    metadata?: Record<string, any>
  }) {
    try {
      const embedding = await this.generateEmbedding(`${documentData.title} ${documentData.content}`)

      const document = await prisma.knowledgeBase.create({
        data: {
          ...documentData,
          embedding,
          tags: documentData.tags || [],
        },
      })

      return document
    } catch (error) {
      logger.error("Error adding document:", error)
      throw error
    }
  }

  async query(query: string, context?: { serverId?: string; category?: string }) {
    try {
      const queryEmbedding = await this.generateEmbedding(query)

      // Simple similarity search (in production, use vector database)
      const documents = await prisma.knowledgeBase.findMany({
        where: {
          ...(context?.category && { category: context.category }),
        },
        take: 5,
      })

      // Generate response using retrieved documents
      const contextText = documents.map((doc:any) => `${doc.title}: ${doc.content}`).join("\n\n")

      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const prompt = `You are a DevOps expert assistant. Use the following context to answer questions about server monitoring, infrastructure, and best practices. If the context doesn't contain relevant information, say so.

Context:
${contextText}

Question: ${query}

Please provide a helpful and concise answer:`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const answer = response.text()

      return {
        answer,
        sources: documents.map((doc:any) => ({
          id: doc.id,
          title: doc.title,
          source: doc.source,
        })),
      }
    } catch (error) {
      logger.error("Error processing query:", error)
      throw error
    }
  }
}
