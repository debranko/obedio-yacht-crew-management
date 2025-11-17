# Multi-stage Dockerfile for OBEDIO Backend
# Optimized for production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and source
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production

# Install PostgreSQL client for backup/restore
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY --from=build /app/prisma ./prisma

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start application
CMD ["npm", "start"]
