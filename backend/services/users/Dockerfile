# ---------- Builder Stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY yarn.lock ./
RUN npm install

# Copy source code and Prisma migrations
COPY src ./src
COPY prisma/migrations ./prisma/migrations
COPY ../../../prisma/schema.prisma ./prisma/schema.prisma
COPY tsconfig.json ./
COPY .env .env

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ---------- Production Stage ----------
FROM node:18-alpine AS prod

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package.json ./
COPY yarn.lock ./
RUN npm install --only=production

# Copy build artifacts and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy .env for runtime
COPY .env .env

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001
CMD ["npm", "start"]
