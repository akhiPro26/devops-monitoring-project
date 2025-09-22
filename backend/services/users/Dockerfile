# ---------- Builder Stage ----------
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy all source files including prisma schema and env
COPY prisma ./prisma
COPY .env .env
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma client
RUN yarn prisma generate

# Build TypeScript
RUN yarn build


# ---------- Production Stage ----------
FROM node:18-alpine AS prod
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only necessary files
COPY package.json yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile --production

# Copy build artifacts and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Copy .env for runtime
COPY .env .env

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001
CMD ["yarn", "start"]
