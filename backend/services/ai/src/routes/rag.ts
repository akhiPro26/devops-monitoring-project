import express from "express"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { RAGService } from "../service/ragService"

const router = express.Router()
const prisma = new PrismaClient()
const ragService = new RAGService()

const querySchema = z.object({
  query: z.string().min(1),
  context: z
    .object({
      serverId: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
})

const documentSchema = z.object({
  title: z.string(),
  content: z.string(),
  source: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * @swagger
 * components:
 *   schemas:
 *     QueryRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           description: The question or query to search for in the knowledge base
 *           minLength: 1
 *           example: "How do I configure Nginx load balancing?"
 *         context:
 *           type: object
 *           description: Optional context to filter search results
 *           properties:
 *             serverId:
 *               type: string
 *               description: Filter by specific server ID
 *               example: "server123"
 *             category:
 *               type: string
 *               description: Filter by document category
 *               enum: [monitoring, security, deployment, troubleshooting, best-practices, configuration]
 *               example: "configuration"
 * 
 *     Document:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - source
 *         - category
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the document
 *           example: "Nginx Load Balancing Configuration Guide"
 *         content:
 *           type: string
 *           description: Full content of the document
 *           example: "To configure Nginx load balancing, you need to define upstream servers in your nginx.conf file..."
 *         source:
 *           type: string
 *           description: Source of the document (URL, file path, etc.)
 *           example: "https://nginx.org/en/docs/http/load_balancing.html"
 *         category:
 *           type: string
 *           description: Category of the document
 *           enum: [monitoring, security, deployment, troubleshooting, best-practices, configuration]
 *           example: "configuration"
 *         tags:
 *           type: array
 *           description: Optional tags for categorization
 *           items:
 *             type: string
 *           example: ["nginx", "load-balancing", "web-server"]
 *         metadata:
 *           type: object
 *           description: Additional metadata about the document
 *           properties:
 *             author:
 *               type: string
 *               example: "DevOps Team"
 *             version:
 *               type: string
 *               example: "1.0"
 *             lastUpdated:
 *               type: string
 *               format: date
 *               example: "2024-01-15"
 *           additionalProperties: true
 * 
 *     StoredDocument:
 *       allOf:
 *         - $ref: '#/components/schemas/Document'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "doc123abc456def789"
 *             embedding:
 *               type: array
 *               description: Vector embedding of the document content
 *               items:
 *                 type: number
 *               example: [0.1, 0.3, -0.2, 0.8]
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: "2024-01-15T10:30:00Z"
 * 
 *     QueryResult:
 *       type: object
 *       properties:
 *         answer:
 *           type: string
 *           description: AI-generated answer based on retrieved documents
 *           example: "To configure Nginx load balancing, you need to define upstream servers in your nginx.conf file. Here's how to set it up..."
 *         sources:
 *           type: array
 *           description: Source documents used to generate the answer
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "doc123abc456def789"
 *               title:
 *                 type: string
 *                 example: "Nginx Load Balancing Configuration Guide"
 *               source:
 *                 type: string
 *                 example: "https://nginx.org/en/docs/http/load_balancing.html"
 * 
 *     QueryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/QueryResult'
 * 
 *     DocumentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/StoredDocument'
 * 
 *     DocumentsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoredDocument'
 * 
 *     DeleteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Document deleted successfully"
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Document not found"
 */

/**
 * @swagger
 * /api/rag/query:
 *   post:
 *     summary: Query the knowledge base using RAG
 *     description: Search the knowledge base and get AI-generated answers based on retrieved documents
 *     tags: [RAG (Knowledge Base)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QueryRequest'
 *           examples:
 *             general_query:
 *               summary: General DevOps question
 *               value:
 *                 query: "How do I monitor CPU usage on Linux servers?"
 *             contextual_query:
 *               summary: Query with server context
 *               value:
 *                 query: "What are the best practices for database backup?"
 *                 context:
 *                   serverId: "server123"
 *                   category: "best-practices"
 *             category_filtered:
 *               summary: Query filtered by category
 *               value:
 *                 query: "How to configure SSL certificates?"
 *                 context:
 *                   category: "security"
 *     responses:
 *       200:
 *         description: Query processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueryResponse'
 *             examples:
 *               successful_query:
 *                 summary: Successful query with answer and sources
 *                 value:
 *                   success: true
 *                   data:
 *                     answer: "To monitor CPU usage on Linux servers, you can use several tools: 1. The 'top' command provides real-time CPU usage information. 2. 'htop' offers a more user-friendly interface. 3. For continuous monitoring, consider using tools like Prometheus with node_exporter, or Nagios. You can also use 'vmstat' for historical data and 'sar' for detailed system activity reports."
 *                     sources:
 *                       - id: "doc123abc456def789"
 *                         title: "Linux System Monitoring Guide"
 *                         source: "internal-docs/monitoring.md"
 *                       - id: "doc456def789abc123"
 *                         title: "CPU Performance Monitoring Best Practices"
 *                         source: "https://example.com/cpu-monitoring"
 *               no_relevant_docs:
 *                 summary: Query with no relevant documents found
 *                 value:
 *                   success: true
 *                   data:
 *                     answer: "I don't have specific information about that topic in my knowledge base. Please consider adding relevant documentation or consulting external resources."
 *                     sources: []
 *       400:
 *         description: Bad request - invalid query format
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
router.post("/query", async (req, res, next) => {
  try {
    const { query, context } = querySchema.parse(req.body)

    const result = await ragService.query(query, context)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/rag/documents:
 *   post:
 *     summary: Add a new document to the knowledge base
 *     description: Store a new document with automatic embedding generation for similarity search
 *     tags: [RAG (Knowledge Base)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Document'
 *           examples:
 *             nginx_guide:
 *               summary: Nginx configuration guide
 *               value:
 *                 title: "Nginx Load Balancing Configuration Guide"
 *                 content: "To configure Nginx load balancing, you need to define upstream servers in your nginx.conf file. Create an upstream block with multiple server entries, then reference it in your location block using proxy_pass."
 *                 source: "https://nginx.org/en/docs/http/load_balancing.html"
 *                 category: "configuration"
 *                 tags: ["nginx", "load-balancing", "web-server"]
 *                 metadata:
 *                   author: "DevOps Team"
 *                   version: "1.0"
 *                   lastUpdated: "2024-01-15"
 *             monitoring_doc:
 *               summary: Monitoring best practices
 *               value:
 *                 title: "Server Monitoring Best Practices"
 *                 content: "Effective server monitoring involves tracking key metrics like CPU usage, memory consumption, disk I/O, and network traffic. Use tools like Prometheus, Grafana, and AlertManager for comprehensive monitoring."
 *                 source: "internal-docs/monitoring-practices.md"
 *                 category: "best-practices"
 *                 tags: ["monitoring", "prometheus", "grafana"]
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentResponse'
 *             examples:
 *               created_document:
 *                 summary: Successfully created document
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "doc123abc456def789"
 *                     title: "Nginx Load Balancing Configuration Guide"
 *                     content: "To configure Nginx load balancing..."
 *                     source: "https://nginx.org/en/docs/http/load_balancing.html"
 *                     category: "configuration"
 *                     tags: ["nginx", "load-balancing", "web-server"]
 *                     metadata:
 *                       author: "DevOps Team"
 *                       version: "1.0"
 *                     embedding: [0.1, 0.3, -0.2, 0.8]
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - invalid document format
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
 *   get:
 *     summary: Get documents from the knowledge base
 *     description: Retrieve documents with optional filtering by category and search terms
 *     tags: [RAG (Knowledge Base)]
 *     parameters:
 *       - in: query
 *         name: category
 *         description: Filter documents by category
 *         schema:
 *           type: string
 *           enum: [monitoring, security, deployment, troubleshooting, best-practices, configuration]
 *           example: "configuration"
 *       - in: query
 *         name: search
 *         description: Search in document title and content
 *         schema:
 *           type: string
 *           example: "nginx load balancing"
 *       - in: query
 *         name: limit
 *         description: Maximum number of documents to return
 *         schema:
 *           type: string
 *           default: "10"
 *           example: "20"
 *       - in: query
 *         name: offset
 *         description: Number of documents to skip (for pagination)
 *         schema:
 *           type: string
 *           default: "0"
 *           example: "10"
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentsListResponse'
 *             examples:
 *               all_documents:
 *                 summary: All documents
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "doc123abc456def789"
 *                       title: "Nginx Load Balancing Configuration Guide"
 *                       content: "To configure Nginx load balancing..."
 *                       source: "https://nginx.org/en/docs/http/load_balancing.html"
 *                       category: "configuration"
 *                       tags: ["nginx", "load-balancing"]
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                     - id: "doc456def789abc123"
 *                       title: "Server Monitoring Best Practices"
 *                       content: "Effective server monitoring involves..."
 *                       source: "internal-docs/monitoring.md"
 *                       category: "best-practices"
 *                       tags: ["monitoring", "prometheus"]
 *                       createdAt: "2024-01-14T15:20:00Z"
 *               filtered_documents:
 *                 summary: Filtered by category and search
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: "doc123abc456def789"
 *                       title: "Nginx Load Balancing Configuration Guide"
 *                       content: "To configure Nginx load balancing..."
 *                       source: "https://nginx.org/en/docs/http/load_balancing.html"
 *                       category: "configuration"
 *                       tags: ["nginx", "load-balancing"]
 *                       createdAt: "2024-01-15T10:30:00Z"
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
router.post("/documents", async (req, res, next) => {
  try {
    const documentData = documentSchema.parse(req.body)

    const document = await ragService.addDocument(documentData)

    res.status(201).json({
      success: true,
      data: document,
    })
  } catch (error) {
    next(error)
  }
})

router.get("/documents", async (req, res, next) => {
  try {
    const { category, search, limit = "10", offset = "0" } = req.query

    const documents = await prisma.knowledgeBase.findMany({
      where: {
        ...(category && { category: category as string }),
        ...(search && {
          OR: [
            { title: { contains: search as string, mode: "insensitive" } },
            { content: { contains: search as string, mode: "insensitive" } },
          ],
        }),
      },
      take: Number.parseInt(limit as string),
      skip: Number.parseInt(offset as string),
      orderBy: { createdAt: "desc" },
    })

    res.json({
      success: true,
      data: documents,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/rag/documents/{id}:
 *   delete:
 *     summary: Delete a document from the knowledge base
 *     description: Remove a document and its associated embedding from the knowledge base
 *     tags: [RAG (Knowledge Base)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the document to delete
 *         schema:
 *           type: string
 *           example: "doc123abc456def789"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteResponse'
 *             examples:
 *               successful_deletion:
 *                 summary: Document successfully deleted
 *                 value:
 *                   success: true
 *                   message: "Document deleted successfully"
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               document_not_found:
 *                 summary: Document not found
 *                 value:
 *                   success: false
 *                   error: "Document not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/documents/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.knowledgeBase.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    next(error)
  }
})

export default router