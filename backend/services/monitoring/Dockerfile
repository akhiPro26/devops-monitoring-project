FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# RUN npm ci --only=production

# Copy source code and Prisma schema
COPY src ./src
COPY prisma ./prisma/
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3002

# Start the application
CMD ["npm", "start"]