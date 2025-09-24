# ========================
# User Service (uses yarn)
# ========================
FROM node:18-alpine AS user-builder
WORKDIR /app/services/users

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY ./services/users/package.json ./services/users/yarn.lock ./
COPY ./prisma ./prisma

# Configure yarn to use alternative registry if needed
RUN yarn config set registry https://registry.npmjs.org/
RUN yarn install --frozen-lockfile --network-timeout 100000
RUN yarn prisma generate

COPY ./services/users/tsconfig.json ./
COPY ./services/users/src ./src
COPY ./shared /app/shared   
RUN yarn build

FROM node:18-alpine AS user-prod
WORKDIR /app/services/users
ENV NODE_ENV=production

# Install OpenSSL for Prisma in production
RUN apk add --no-cache openssl libc6-compat

COPY ./services/users/package.json ./services/users/yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=user-builder /app/services/users/dist ./dist
COPY --from=user-builder /app/services/users/prisma ./prisma
COPY --from=user-builder /app/services/users/node_modules/.prisma ./node_modules/.prisma
COPY --from=user-builder /app/services/users/node_modules/@prisma ./node_modules/@prisma
COPY ./services/users/.env ./.env

RUN mkdir -p logs
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && yarn start"]

# ========================
# Monitoring Service (uses npm)
# ========================
FROM node:18-alpine AS monitoring-builder
WORKDIR /app/services/monitoring

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY ./services/monitoring/package*.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm install --network-timeout=100000

COPY ./prisma ./prisma
RUN npx prisma generate

COPY ./services/monitoring/src ./src
COPY ./services/monitoring/tsconfig.json ./
COPY ./shared /app/shared   
RUN npm run build

FROM node:18-alpine AS monitoring-prod
WORKDIR /app/services/monitoring
ENV NODE_ENV=production

# Install OpenSSL for Prisma in production
RUN apk add --no-cache openssl libc6-compat

COPY ./services/monitoring/package*.json ./
RUN npm install --only=production

COPY --from=monitoring-builder /app/services/monitoring/dist ./dist
COPY --from=monitoring-builder /app/services/monitoring/prisma ./prisma
COPY --from=monitoring-builder /app/services/monitoring/node_modules/.prisma ./node_modules/.prisma
COPY --from=monitoring-builder /app/services/monitoring/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p logs
EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

# ========================
# AI Service (uses npm)
# ========================
FROM node:18-alpine AS ai-builder
WORKDIR /app/services/ai

# Install build dependencies including OpenSSL
RUN apk add --no-cache bash libc6-compat openssl curl

# Copy package files and install dependencies
COPY ./services/ai/package*.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm install --network-timeout=100000

# Copy source + shared code
COPY ./services/ai/src ./src
COPY ./services/ai/tsconfig.json ./
COPY ./shared /app/shared

# Generate Prisma client
COPY ./services/ai/prisma ./prisma
RUN npx prisma generate

# Build TypeScript
RUN npm run build

FROM node:18-alpine AS ai-prod
WORKDIR /app/services/ai
ENV NODE_ENV=production

# Install runtime dependencies including OpenSSL and curl
RUN apk add --no-cache openssl libc6-compat curl

# Copy package files and install dependencies
COPY ./services/ai/package*.json ./
RUN npm install --only=production

# Copy compiled code, Prisma client, and shared code
COPY --from=ai-builder /app/services/ai/dist ./dist
COPY --from=ai-builder /app/services/ai/prisma ./prisma
COPY --from=ai-builder /app/shared /app/shared
COPY --from=ai-builder /app/services/ai/node_modules/.prisma ./node_modules/.prisma
COPY --from=ai-builder /app/services/ai/node_modules/@prisma ./node_modules/@prisma

# Expose port + healthcheck
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Use standard start command (assuming your build outputs to dist/index.js)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

# ========================
# Notification Service (uses npm)
# ========================
FROM node:18-alpine AS notification-builder
WORKDIR /app/services/notification

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat curl bash

COPY ./services/notification/package*.json ./
RUN npm install --network-timeout=100000

# Copy source + shared + Prisma schema
COPY ./services/notification/src ./src
COPY ./services/notification/tsconfig.json ./
COPY ./shared /app/shared
COPY ./services/notification/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage

FROM node:18-alpine AS notification-prod
WORKDIR /app/services/notification
ENV NODE_ENV=production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat curl bash

# Install only runtime dependencies
COPY ./services/notification/package*.json ./
RUN npm install --only=production

# Copy built code + Prisma client + shared code
COPY --from=notification-builder /app/services/notification/dist ./dist
COPY --from=notification-builder /app/services/notification/prisma ./prisma
COPY --from=notification-builder /app/services/notification/node_modules/.prisma ./node_modules/.prisma
COPY --from=notification-builder /app/services/notification/node_modules/@prisma ./node_modules/@prisma
COPY --from=notification-builder /app/shared /app/shared

EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3004/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/services/notification/src/index.js"]
