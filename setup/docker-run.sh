#!/bin/bash

# One-Click Docker Runner for Multi-Agent Observability
# =====================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
IMAGE_NAME="claude-observability"
CONTAINER_NAME="claude-observability"

# ASCII Art
echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🐳 Docker One-Click Runner 🐳                          ║
║                                                              ║
║     Multi-Agent Observability System                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker and try again.${NC}"
    echo -e "${BLUE}Visit: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Stop existing container if running
if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
    docker stop $CONTAINER_NAME >/dev/null 2>&1
fi

# Remove existing container
if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
    echo -e "${YELLOW}🗑️  Removing existing container...${NC}"
    docker rm $CONTAINER_NAME >/dev/null 2>&1
fi

# Check for API key
API_KEY="${ANTHROPIC_API_KEY:-}"
if [ -z "$API_KEY" ] || [ "$API_KEY" = "your_anthropic_api_key_here" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not found in environment${NC}"
    echo -n "Please enter your Anthropic API key: "
    read -s API_KEY
    echo ""
    
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}❌ API key is required to run the system${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -t $IMAGE_NAME . --quiet

echo -e "${BLUE}🚀 Starting container...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    -p 4000:4000 \
    -p 5173:5173 \
    -e ANTHROPIC_API_KEY="$API_KEY" \
    -e ENGINEER_NAME="${ENGINEER_NAME:-Developer}" \
    -e GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
    -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
    -e ELEVEN_API_KEY="${ELEVEN_API_KEY:-}" \
    -v claude-observability-data:/app/data \
    --restart unless-stopped \
    $IMAGE_NAME

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"

# Wait for services with timeout
TIMEOUT=60
COUNTER=0

while [ $COUNTER -lt $TIMEOUT ]; do
    if curl -s http://localhost:4000/events/filter-options >/dev/null 2>&1 && \
       curl -s http://localhost:5173 >/dev/null 2>&1; then
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 2))
    printf "."
done

echo ""

if [ $COUNTER -ge $TIMEOUT ]; then
    echo -e "${RED}❌ Services failed to start within $TIMEOUT seconds${NC}"
    echo -e "${YELLOW}Check container logs: docker logs $CONTAINER_NAME${NC}"
    exit 1
fi

# Success message
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║  🎉 Multi-Agent Observability System is Running! 🎉         ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}🌐 Access Points:${NC}"
echo -e "   • Dashboard: ${GREEN}http://localhost:5173${NC}"
echo -e "   • API:       ${GREEN}http://localhost:4000${NC}"

echo -e "\n${CYAN}🛠️  Container Management:${NC}"
echo -e "   • View logs:   ${BLUE}docker logs -f $CONTAINER_NAME${NC}"
echo -e "   • Stop:        ${BLUE}docker stop $CONTAINER_NAME${NC}"
echo -e "   • Restart:     ${BLUE}docker restart $CONTAINER_NAME${NC}"

echo -e "\n${CYAN}🪝 Setup Hooks for Your Projects:${NC}"
echo -e "   1. Copy hooks: ${BLUE}docker cp $CONTAINER_NAME:/app/hooks ./your-project/.claude${NC}"
echo -e "   2. Update settings with your project name"
echo -e "   3. Run Claude Code commands and watch events!"

echo -e "\n${GREEN}Happy monitoring! 🤖✨${NC}"