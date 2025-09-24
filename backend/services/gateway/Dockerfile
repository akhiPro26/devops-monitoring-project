# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma or other native modules
RUN apk add --no-cache bash openssl libc6-compat curl

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source + tsconfig
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app

# Install runtime dependencies
COPY package*.json ./
RUN npm ci --only=production
RUN apk add --no-cache bash openssl libc6-compat curl

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
