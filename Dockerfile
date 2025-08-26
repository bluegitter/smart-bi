# Multi-stage build for production optimization
FROM node:20-alpine AS base
# Configure Alpine mirrors for faster downloads in China
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update

# Install dependencies only when needed  
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files and install ALL dependencies (including dev deps for build)
COPY package.json package-lock.json* ./
# Use npm registry mirror for faster downloads in China
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm ci && npm cache clean --force


# Rebuild the source code only when needed
FROM base AS builder  
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Configure npm mirror and build the application
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Install curl for health check
RUN apk add --no-cache curl

# Create system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public folder
COPY --from=builder /app/public ./public

# Create and set permissions for .next directory
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built application files with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]