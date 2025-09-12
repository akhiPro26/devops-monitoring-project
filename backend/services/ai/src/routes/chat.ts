import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { ChatService } from "../service/chatService"

const router = express.Router()
const prisma = new PrismaClient()
const chatService = new ChatService()

const chatMessageSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  userId: z.string(),
  context: z.record(z.any()).optional(),
})

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       required:
 *         - message
 *         - userId
 *       properties:
 *         message:
 *           type: string
 *           description: The user's chat message
 *           example: "How do I monitor CPU usage on my server?"
 *         sessionId:
 *           type: string
 *           description: Optional existing chat session ID
 *           example: "clh123abc456def789"
 *         userId:
 *           type: string
 *           description: ID of the user sending the message
 *           example: "user123"
 *         context:
 *           type: object
 *           description: Optional context information
 *           properties:
 *             serverId:
 *               type: string
 *               example: "server123"
 *           additionalProperties: true
 * 
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             sessionId:
 *               type: string
 *               example: "clh123abc456def789"
 *             response:
 *               type: string
 *               example: "To monitor CPU usage, you can use the 'top' command or install monitoring tools like htop or Prometheus."
 *             sources:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   content:
 *                     type: string
 *                   relevance:
 *                     type: number
 * 
 *     ChatSession:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clh123abc456def789"
 *         userId:
 *           type: string
 *           example: "user123"
 *         title:
 *           type: string
 *           example: "How do I monitor CPU usage on my server?..."
 *         messages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, assistant]
 *               content:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         context:
 *           type: object
 *           additionalProperties: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     SessionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChatSession'
 * 
 *     SessionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ChatSession'
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Session not found"
 */

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a chat message
 *     description: Process a chat message and get AI response with DevOps expertise
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *           examples:
 *             new_conversation:
 *               summary: Start new conversation
 *               value:
 *                 message: "How do I set up Nginx load balancing?"
 *                 userId: "user123"
 *                 context:
 *                   serverId: "server456"
 *             existing_session:
 *               summary: Continue existing conversation
 *               value:
 *                 message: "What about SSL termination?"
 *                 sessionId: "clh123abc456def789"
 *                 userId: "user123"
 *     responses:
 *       200:
 *         description: Message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   success: true
 *                   data:
 *                     sessionId: "clh123abc456def789"
 *                     response: "To set up Nginx load balancing, you need to configure upstream servers in your nginx.conf file..."
 *                     sources:
 *                       - id: "doc123"
 *                         content: "Nginx load balancing configuration..."
 *                         relevance: 0.95
 *       400:
 *         description: Bad request - invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/message", async (req, res, next) => {
  try {
    const messageData = chatMessageSchema.parse(req.body)

    const response = await chatService.processMessage(messageData)

    res.json({
      success: true,
      data: response,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/chat/sessions/{userId}:
 *   get:
 *     summary: Get chat sessions for a user
 *     description: Retrieve paginated list of chat sessions for a specific user
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *           example: "user123"
 *       - in: query
 *         name: limit
 *         description: Maximum number of sessions to return
 *         schema:
 *           type: string
 *           default: "10"
 *           example: "20"
 *       - in: query
 *         name: offset
 *         description: Number of sessions to skip (for pagination)
 *         schema:
 *           type: string
 *           default: "0"
 *           example: "10"
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionsResponse'
 *             examples:
 *               success:
 *                 summary: List of user sessions
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "clh123abc456def789"
 *                       userId: "user123"
 *                       title: "How do I monitor CPU usage on my server?..."
 *                       messages: []
 *                       context: {}
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:45:00Z"
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/sessions/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params
    const { limit = "10", offset = "0" } = req.query

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      take: Number.parseInt(limit as string),
      skip: Number.parseInt(offset as string),
      orderBy: { updatedAt: "desc" },
    })

    res.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/chat/sessions/{userId}/{sessionId}:
 *   get:
 *     summary: Get a specific chat session
 *     description: Retrieve a specific chat session with full message history
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user who owns the session
 *         schema:
 *           type: string
 *           example: "user123"
 *       - in: path
 *         name: sessionId
 *         required: true
 *         description: ID of the chat session
 *         schema:
 *           type: string
 *           example: "clh123abc456def789"
 *     responses:
 *       200:
 *         description: Session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionResponse'
 *             examples:
 *               success:
 *                 summary: Session with full conversation history
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "clh123abc456def789"
 *                     userId: "user123"
 *                     title: "How do I monitor CPU usage on my server?..."
 *                     messages:
 *                       - role: "user"
 *                         content: "How do I monitor CPU usage?"
 *                         timestamp: "2024-01-15T10:30:00Z"
 *                       - role: "assistant"
 *                         content: "You can monitor CPU usage using several tools..."
 *                         timestamp: "2024-01-15T10:30:05Z"
 *                     context:
 *                       serverId: "server456"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:45:00Z"
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Session not found
 *                 value:
 *                   success: false
 *                   error: "Session not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/sessions/:userId/:sessionId", async (req, res, next) => {
  try {
    const { userId, sessionId } = req.params

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    })

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      })
    }

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    next(error)
  }
})

export default router