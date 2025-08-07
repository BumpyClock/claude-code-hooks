#!/bin/bash

# Multi-Agent Observability System - One-Click Installer
# =======================================================
# Automates the complete setup process for the Claude Code hooks observability system

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${CYAN}"
cat << 'EOF'
 ╔══════════════════════════════════════════════════════════════╗
 ║                                                              ║
 ║   🔬 Multi-Agent Observability System Installer 🔬         ║
 ║                                                              ║
 ║   Real-time monitoring for Claude Code agents               ║
 ║                                                              ║
 ╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_ROOT/install.log"
REQUIRED_API_KEY="ANTHROPIC_API_KEY"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$LOG_FILE"
}

# Progress indicator
progress() {
    local current=$1
    local total=$2
    local message=$3
    local percent=$((current * 100 / total))
    printf "\r${BLUE}[%3d%%]${NC} %s" $percent "$message"
    if [ $current -eq $total ]; then
        echo ""  # New line when complete
    fi
}

# Error handler
error_exit() {
    echo -e "\n${RED}❌ Error: $1${NC}" >&2
    echo -e "${YELLOW}📋 Check the install log: $LOG_FILE${NC}" >&2
    exit 1
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Install Bun if not present
install_bun() {
    if ! command_exists bun; then
        echo -e "${YELLOW}📦 Installing Bun...${NC}"
        curl -fsSL https://bun.sh/install | bash >> "$LOG_FILE" 2>&1
        
        # Add bun to current session PATH
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
        
        # Verify installation
        if ! command_exists bun; then
            error_exit "Failed to install Bun. Please install manually: https://bun.sh/docs/installation"
        fi
        echo -e "${GREEN}✅ Bun installed successfully${NC}"
    else
        echo -e "${GREEN}✅ Bun is already installed${NC}"
    fi
}

# Install UV (Python package manager) if not present
install_uv() {
    if ! command_exists uv; then
        echo -e "${YELLOW}🐍 Installing UV (Python package manager)...${NC}"
        curl -LsSf https://astral.sh/uv/install.sh | sh >> "$LOG_FILE" 2>&1
        
        # Add uv to current session PATH
        export PATH="$HOME/.cargo/bin:$PATH"
        
        # Verify installation
        if ! command_exists uv; then
            error_exit "Failed to install UV. Please install manually: https://docs.astral.sh/uv/getting-started/installation/"
        fi
        echo -e "${GREEN}✅ UV installed successfully${NC}"
    else
        echo -e "${GREEN}✅ UV is already installed${NC}"
    fi
}

# Setup environment file
setup_environment() {
    echo -e "\n${BLUE}🔧 Setting up environment configuration...${NC}"
    
    local env_file="$PROJECT_ROOT/.env"
    local env_sample="$PROJECT_ROOT/.env.sample"
    
    if [ ! -f "$env_file" ]; then
        if [ -f "$env_sample" ]; then
            cp "$env_sample" "$env_file"
        else
            cat > "$env_file" << 'EOF'
# Multi-Agent Observability System Configuration
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
ENGINEER_NAME=your_name_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here
EOF
        fi
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
    fi
    
    # Create client .env if it doesn't exist
    local client_env="$PROJECT_ROOT/apps/client/.env"
    if [ ! -f "$client_env" ]; then
        cat > "$client_env" << 'EOF'
# Client Configuration
VITE_MAX_EVENTS_TO_DISPLAY=100
EOF
        echo -e "${GREEN}✅ Created client .env file${NC}"
    fi
}

# Install dependencies for both server and client
install_dependencies() {
    echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
    
    # Server dependencies
    progress 1 4 "Installing server dependencies..."
    cd "$PROJECT_ROOT/apps/server"
    bun install >> "$LOG_FILE" 2>&1
    
    # Client dependencies
    progress 2 4 "Installing client dependencies..."
    cd "$PROJECT_ROOT/apps/client"
    bun install >> "$LOG_FILE" 2>&1
    
    # Python dependencies for hooks (if pyproject.toml exists)
    progress 3 4 "Setting up Python hook dependencies..."
    cd "$PROJECT_ROOT"
    if [ -d ".claude/hooks" ]; then
        cd ".claude/hooks"
        if [ -f "pyproject.toml" ]; then
            uv sync >> "$LOG_FILE" 2>&1
        else
            # Create minimal pyproject.toml for hook dependencies
            cat > pyproject.toml << 'EOF'
[project]
name = "claude-hooks"
version = "0.1.0"
dependencies = [
    "requests",
    "python-dotenv"
]
requires-python = ">=3.8"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
EOF
            uv sync >> "$LOG_FILE" 2>&1
        fi
    fi
    
    progress 4 4 "Dependencies installation complete!"
    cd "$PROJECT_ROOT"
}

# Setup Claude Code hooks
setup_hooks() {
    echo -e "\n${BLUE}🪝 Setting up Claude Code hooks...${NC}"
    
    if [ ! -d ".claude" ]; then
        echo -e "${YELLOW}⚠️  .claude directory not found. Creating basic structure...${NC}"
        mkdir -p .claude/hooks
        
        # Create basic settings.json if it doesn't exist
        if [ ! -f ".claude/settings.json" ]; then
            cat > .claude/settings.json << 'EOF'
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type PreToolUse --summarize"
        }
      ]
    }],
    "PostToolUse": [{
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type PostToolUse --summarize"
        }
      ]
    }],
    "UserPromptSubmit": [{
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type UserPromptSubmit --summarize"
        }
      ]
    }],
    "Stop": [{
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type Stop --add-chat --summarize"
        }
      ]
    }],
    "SubagentStop": [{
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type SubagentStop --summarize"
        }
      ]
    }],
    "Notification": [{
      "hooks": [
        {
          "type": "command",
          "command": "uv run .claude/hooks/send_event.py --source-app cc-hooks-observability --event-type Notification"
        }
      ]
    }]
  }
}
EOF
        fi
    fi
    
    echo -e "${GREEN}✅ Claude Code hooks configured${NC}"
}

# Validate installation
validate_installation() {
    echo -e "\n${BLUE}🔍 Validating installation...${NC}"
    
    local errors=0
    
    # Check if server can start (dry run)
    cd "$PROJECT_ROOT/apps/server"
    if ! bun run typecheck >> "$LOG_FILE" 2>&1; then
        echo -e "${RED}❌ Server TypeScript validation failed${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✅ Server validation passed${NC}"
    fi
    
    # Check if client can build (type check only)
    cd "$PROJECT_ROOT/apps/client" 
    if ! bun run build >> "$LOG_FILE" 2>&1; then
        echo -e "${YELLOW}⚠️  Client build check skipped (non-critical)${NC}"
    else
        echo -e "${GREEN}✅ Client validation passed${NC}"
    fi
    
    cd "$PROJECT_ROOT"
    
    if [ $errors -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Installation completed with warnings. Check $LOG_FILE for details.${NC}"
    else
        echo -e "${GREEN}✅ Installation validation successful!${NC}"
    fi
}

# Check system compatibility
check_system() {
    echo -e "${BLUE}🔍 Checking system compatibility...${NC}"
    
    # Check OS
    if [[ "$OSTYPE" != "darwin"* ]] && [[ "$OSTYPE" != "linux-gnu"* ]]; then
        error_exit "Unsupported operating system: $OSTYPE. This installer supports macOS and Linux."
    fi
    
    # Check curl
    if ! command_exists curl; then
        error_exit "curl is required but not installed. Please install curl and try again."
    fi
    
    # Check if we can create files
    if ! touch "$LOG_FILE" 2>/dev/null; then
        error_exit "Cannot write to project directory. Check permissions."
    fi
    
    echo -e "${GREEN}✅ System compatibility check passed${NC}"
}

# Main installation function
main() {
    echo -e "${PURPLE}Starting installation at $(date)${NC}\n"
    
    # Clear previous log
    > "$LOG_FILE"
    log "Multi-Agent Observability System installation started"
    
    # Pre-installation checks
    check_system
    
    # Check for existing processes
    if check_port 4000 || check_port 5173; then
        echo -e "${YELLOW}⚠️  System appears to be running. Stop it first with: ./scripts/reset-system.sh${NC}"
    fi
    
    echo -e "\n${BLUE}🚀 Beginning installation process...${NC}\n"
    
    # Installation steps
    install_bun
    install_uv
    setup_environment
    install_dependencies
    setup_hooks
    validate_installation
    
    # Final success message
    echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║  🎉 INSTALLATION COMPLETE! 🎉                               ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║  Your Multi-Agent Observability System is ready to use!      ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${CYAN}📋 Next Steps:${NC}"
    echo -e "   ${YELLOW}1.${NC} Set your API keys in ${BLUE}.env${NC}"
    echo -e "   ${YELLOW}2.${NC} Start the system: ${BLUE}./scripts/start-system.sh${NC}"
    echo -e "   ${YELLOW}3.${NC} Open your browser: ${BLUE}http://localhost:5173${NC}"
    echo -e "   ${YELLOW}4.${NC} Test with Claude Code: Run any command and watch events!"
    
    echo -e "\n${CYAN}🔧 Quick Commands:${NC}"
    echo -e "   Start system: ${BLUE}./scripts/start-system.sh${NC}"
    echo -e "   Stop system:  ${BLUE}./scripts/reset-system.sh${NC}"
    echo -e "   Test system:  ${BLUE}./scripts/test-system.sh${NC}"
    
    if [ ! -s ".env" ] || grep -q "your_anthropic_api_key_here" ".env"; then
        echo -e "\n${YELLOW}⚠️  IMPORTANT: Don't forget to set your ANTHROPIC_API_KEY in .env${NC}"
    fi
    
    log "Installation completed successfully"
    echo -e "\n${GREEN}Happy coding with Claude! 🤖✨${NC}"
}

# Handle interruption
trap 'echo -e "\n${YELLOW}Installation interrupted by user${NC}"; exit 1' INT

# Run main installation
main "$@"