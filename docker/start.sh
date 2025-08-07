#!/bin/bash

# Docker container startup script
# ===============================

set -euo pipefail

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Multi-Agent Observability System in Docker${NC}"
echo "========================================================"

# Validate required environment variables
if [ "${ANTHROPIC_API_KEY:-}" = "your_anthropic_api_key_here" ] || [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo -e "${RED}❌ ERROR: ANTHROPIC_API_KEY is not set or is using placeholder value${NC}"
    echo -e "${YELLOW}Please set a valid Anthropic API key in your environment or docker-compose.yml${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment validation passed${NC}"

# Initialize database if it doesn't exist
DB_PATH="${DATABASE_PATH:-/app/data/events.db}"
if [ ! -f "$DB_PATH" ]; then
    echo -e "${BLUE}📊 Initializing database...${NC}"
    mkdir -p "$(dirname "$DB_PATH")"
fi

# Start the server in the background
echo -e "${BLUE}🔧 Starting API server on port 4000...${NC}"
cd /app/server
bun run src/index.ts &
SERVER_PID=$!

# Wait for server to be ready
echo -e "${YELLOW}⏳ Waiting for server to initialize...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4000/events/filter-options >/dev/null 2>&1; then
        echo -e "${GREEN}✅ API server is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
        exit 1
    fi
    sleep 1
done

# Start static file server for client on port 5173
echo -e "${BLUE}🌐 Starting client UI server on port 5173...${NC}"
cd /app
bun serve public --port 5173 --hostname 0.0.0.0 &
CLIENT_PID=$!

# Wait for client server to be ready
echo -e "${YELLOW}⏳ Waiting for client server to start...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Client UI server is ready!${NC}"
        break
    fi
    sleep 1
done

# Display startup information
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║  🎉 Multi-Agent Observability System Started! 🎉            ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}🔗 Access Points:${NC}"
echo -e "   • Web UI:    ${GREEN}http://localhost:5173${NC}"
echo -e "   • API:       ${GREEN}http://localhost:4000${NC}"
echo -e "   • WebSocket: ${GREEN}ws://localhost:4000/stream${NC}"

echo -e "\n${BLUE}📊 System Info:${NC}"
echo -e "   • Database:  ${DB_PATH}"
echo -e "   • Engineer:  ${ENGINEER_NAME:-Not set}"
echo -e "   • Log Level: ${LOG_LEVEL:-info}"

echo -e "\n${YELLOW}🪝 Hook Integration:${NC}"
echo -e "   Copy hooks to your project with:"
echo -e "   ${BLUE}docker cp claude-observability:/app/hooks ./your-project/.claude${NC}"

echo -e "\n${GREEN}System is ready! Monitor your Claude Code agents in real-time.${NC}"

# Function to handle shutdown gracefully
shutdown() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Shutdown complete${NC}"
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Keep the container running
wait $SERVER_PID $CLIENT_PID