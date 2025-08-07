# Multi-Agent Observability System
# =================================
# Multi-stage Docker build for production deployment

# Stage 1: Build the client
FROM oven/bun:1.1 as client-builder
WORKDIR /app/client

# Copy client package files
COPY apps/client/package.json apps/client/bun.lock* ./

# Install client dependencies
RUN bun install --frozen-lockfile

# Copy client source
COPY apps/client/ ./

# Build client for production
RUN bun run build

# Stage 2: Build the server
FROM oven/bun:1.1 as server-builder
WORKDIR /app/server

# Copy server package files
COPY apps/server/package.json apps/server/bun.lock* ./

# Install server dependencies
RUN bun install --frozen-lockfile

# Copy server source
COPY apps/server/ ./

# Stage 3: Production runtime
FROM oven/bun:1.1-slim as runtime

# Install system dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy built client assets
COPY --from=client-builder /app/client/dist ./public
COPY --from=client-builder /app/client/package.json ./client-package.json

# Copy server files
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/server/node_modules ./server/node_modules

# Copy .claude hooks for extraction by users
COPY .claude ./hooks

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data

# Copy startup script
COPY docker/start.sh ./
RUN chmod +x start.sh

# Expose ports
EXPOSE 4000 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/events/filter-options || exit 1

# Switch to non-root user
USER appuser

# Environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/events.db
ENV CLIENT_DIST=/app/public

# Start the application
CMD ["./start.sh"]