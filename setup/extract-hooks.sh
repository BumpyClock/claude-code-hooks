#!/bin/bash

# Extract Claude Code hooks from Docker container to local project
# ================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

usage() {
    echo -e "${BLUE}Extract Claude Code hooks from Docker container${NC}\n"
    echo "Usage: $0 <target-project-path> [project-name]"
    echo ""
    echo "Arguments:"
    echo "  target-project-path    Path to your project directory"
    echo "  project-name          Name for this project (optional)"
    echo ""
    echo "Examples:"
    echo "  $0 /path/to/my-api-server"
    echo "  $0 /path/to/my-api-server \"My API Server\""
    echo ""
    echo "Prerequisites:"
    echo "  - Docker container 'claude-observability' must be running"
    echo "  - Target directory must exist"
}

if [ $# -lt 1 ]; then
    usage
    exit 1
fi

TARGET_DIR="$1"
PROJECT_NAME="${2:-$(basename "$TARGET_DIR")}"
CONTAINER_NAME="claude-observability"

# Validate target directory
if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Error: Target directory '$TARGET_DIR' does not exist${NC}"
    exit 1
fi

# Check if Docker container exists and is running
if ! docker ps --format "table {{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
    echo -e "${RED}❌ Error: Docker container '$CONTAINER_NAME' is not running${NC}"
    echo -e "${YELLOW}Start it with: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${BLUE}🪝 Extracting hooks for: ${YELLOW}$PROJECT_NAME${NC}"
echo -e "   Target: $TARGET_DIR\n"

# Extract hooks from container
echo -e "${BLUE}📁 Copying .claude directory from container...${NC}"
if docker cp "$CONTAINER_NAME:/app/hooks" "$TARGET_DIR/.claude"; then
    echo -e "${GREEN}✅ Copied .claude directory${NC}"
else
    echo -e "${RED}❌ Failed to copy hooks from container${NC}"
    exit 1
fi

# Update settings.json with project name
SETTINGS_FILE="$TARGET_DIR/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    echo -e "${BLUE}⚙️  Configuring hooks for '$PROJECT_NAME'...${NC}"
    
    # Use sed to replace the source-app parameter
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed syntax
        sed -i '' "s/cc-hooks-observability/$PROJECT_NAME/g" "$SETTINGS_FILE"
    else
        # Linux sed syntax
        sed -i "s/cc-hooks-observability/$PROJECT_NAME/g" "$SETTINGS_FILE"
    fi
    
    echo -e "${GREEN}✅ Updated hooks configuration${NC}"
else
    echo -e "${YELLOW}⚠️  Settings file not found in extracted hooks${NC}"
fi

# Check Python dependencies
echo -e "${BLUE}🐍 Checking Python dependencies...${NC}"
cd "$TARGET_DIR/.claude/hooks"

if [ ! -f "pyproject.toml" ]; then
    echo -e "${YELLOW}⚠️  Creating pyproject.toml for dependencies...${NC}"
    cat > pyproject.toml << 'EOF'
[project]
name = "claude-hooks"
version = "0.1.0"
dependencies = [
    "requests>=2.28.0",
    "python-dotenv>=0.19.0",
    "anthropic>=0.25.0",
    "openai>=1.0.0"
]
requires-python = ">=3.8"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
EOF
fi

# Install dependencies if uv is available
if command -v uv >/dev/null 2>&1; then
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    uv sync
    echo -e "${GREEN}✅ Python dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  UV not found. Install with: ${BLUE}curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
    echo -e "   Then run: ${BLUE}cd $TARGET_DIR/.claude/hooks && uv sync${NC}"
fi

# Test connection to observability server
echo -e "\n${BLUE}🧪 Testing connection to observability server...${NC}"
if curl -s http://localhost:4000/events/filter-options >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful!${NC}"
    
    # Send test event
    cd "$TARGET_DIR"
    if command -v uv >/dev/null 2>&1; then
        echo '{"test": true}' | uv run .claude/hooks/send_event.py --source-app "$PROJECT_NAME" --event-type "Test" >/dev/null 2>&1 && \
        echo -e "${GREEN}✅ Test event sent successfully${NC}" || \
        echo -e "${YELLOW}⚠️  Test event failed (check logs)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Observability server not accessible at localhost:4000${NC}"
    echo -e "   Make sure the Docker container is running and ports are mapped correctly"
fi

# Final instructions
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║  🎉 Hooks Extracted Successfully! 🎉                        ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo -e "   ${YELLOW}1.${NC} Go to your project: ${BLUE}cd '$TARGET_DIR'${NC}"
echo -e "   ${YELLOW}2.${NC} Run Claude Code commands and watch events at ${BLUE}http://localhost:5173${NC}"
echo -e "   ${YELLOW}3.${NC} Configure LLM provider in your ${BLUE}.env${NC} file:"
echo -e "      ${BLUE}SUMMARY_LLM_PROVIDER=anthropic  # or openai${NC}"

echo -e "\n${BLUE}Your project is now monitored! All Claude Code actions will be tracked.${NC}"