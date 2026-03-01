# Multi-stage build for production optimization
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy shared common folder
COPY common ./common

# Setup service directory
WORKDIR /app/violation-service

# Copy package files
COPY violation-service/package*.json ./
COPY violation-service/tsconfig.json ./
COPY violation-service/prisma ./prisma

# Install dependencies
RUN npm install --registry=https://registry.npmjs.org/

# Copy source code
COPY violation-service .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy common folder to production stage
COPY common ./common

WORKDIR /app/violation-service

# Copy package files
COPY violation-service/package*.json ./

# Install production dependencies only
COPY violation-service/prisma ./prisma
RUN npm install --registry=https://registry.npmjs.org/ --omit=dev --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/violation-service/dist ./dist

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/app.js"]
