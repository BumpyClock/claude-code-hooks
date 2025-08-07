#!/bin/bash

# Multi-Agent Observability System - Universal Starter
# ====================================================
# One script to rule them all - detects and runs the best installation method

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🔬 Multi-Agent Observability System 🔬              ║
║                                                              ║
║            Universal One-Click Starter                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}🔍 Detecting best installation method...${NC}\n"

# Check if Docker is available and running
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker detected and running${NC}"
    
    # Check for API key
    if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
        if [ -f ".env" ] && grep -q "ANTHROPIC_API_KEY=" ".env" && ! grep -q "your_anthropic_api_key_here" ".env"; then
            echo -e "${GREEN}✅ API key found in .env file${NC}"
        else
            echo -e "${YELLOW}⚠️  Setting up environment...${NC}"
            if [ ! -f ".env" ]; then
                cp .env.sample .env
            fi
            echo -e "${BLUE}Please edit .env and add your ANTHROPIC_API_KEY${NC}"
            echo -e "${BLUE}Get your key from: https://console.anthropic.com/${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ API key found in environment${NC}"
    fi
    
    echo -e "\n${BLUE}🚀 Starting with Docker (recommended)...${NC}"
    docker-compose up -d
    
    echo -e "\n${GREEN}✅ System started!${NC}"
    echo -e "${CYAN}🌐 Dashboard: http://localhost:5173${NC}"
    echo -e "${CYAN}📡 API: http://localhost:4000${NC}"
    
    echo -e "\n${BLUE}🪝 To monitor your projects:${NC}"
    echo -e "   ${YELLOW}./setup/extract-hooks.sh /path/to/your/project \"Project Name\"${NC}"
    
else
    echo -e "${YELLOW}⚠️  Docker not available, using local development setup...${NC}"
    
    if [ ! -f "apps/server/package.json" ]; then
        echo -e "${BLUE}📦 Running full installation...${NC}"
        ./setup/install.sh
    fi
    
    echo -e "${BLUE}🚀 Starting local development servers...${NC}"
    ./scripts/start-system.sh
fi

echo -e "\n${GREEN}🎉 Ready! Open http://localhost:5173 and run Claude Code commands to see events!${NC}"