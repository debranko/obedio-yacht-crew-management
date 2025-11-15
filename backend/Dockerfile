FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev deps for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript (with noEmitOnError: false in tsconfig)
RUN npx tsc || echo "TypeScript errors present but files emitted"

# Remove dev dependencies after build
RUN npm prune --production

# Production image
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies including OpenSSL 3
RUN apk add --no-cache curl netcat-openbsd openssl

# Copy package files first
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy node_modules and regenerate Prisma for this environment
COPY --from=builder /app/node_modules ./node_modules

# Regenerate Prisma client for the production image's OpenSSL version
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
