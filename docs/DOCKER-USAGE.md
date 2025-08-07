# Docker Usage Guide - Complete Workflow

## 🚀 Quick Start (Zero Configuration)

```bash
# 1. Set your API key and start
export ANTHROPIC_API_KEY="sk-ant-..."
docker-compose up -d

# 2. Open dashboard
open http://localhost:5173

# 3. Extract hooks to your project
./extract-hooks.sh /path/to/your/project "My Project"

# 4. Done! Run Claude Code in your project and watch events
```

## 🔧 Configuration Options

### LLM Provider Selection

Set in your `.env` file:

```env
# Choose your LLM for event summaries
SUMMARY_LLM_PROVIDER=anthropic  # Default: fast, cost-effective

# Other options:
# SUMMARY_LLM_PROVIDER=openai    # Use OpenAI GPT models
# SUMMARY_LLM_PROVIDER=claude    # Same as anthropic
# SUMMARY_LLM_PROVIDER=gpt       # Same as openai
```

**Auto-Selection Logic:**
1. Uses your `SUMMARY_LLM_PROVIDER` preference if API key is available
2. Falls back to Anthropic if available (faster/cheaper)
3. Falls back to OpenAI if available
4. Uses template-based summaries if no LLM available

### API Key Requirements

```env
# For Anthropic LLM (recommended)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# For OpenAI LLM (optional alternative)
OPENAI_API_KEY=sk-your-openai-key-here

# Both can be set - system will choose based on SUMMARY_LLM_PROVIDER
```

## 📁 Hook Integration Workflow

### Automated Hook Setup

```bash
# Start observability system
docker-compose up -d

# Extract and configure hooks for any project
./extract-hooks.sh /path/to/my-api-server "My API Server"
./extract-hooks.sh /path/to/my-frontend "Frontend App"
./extract-hooks.sh /path/to/my-cli-tool "CLI Tool"

# Each project now sends events to the same dashboard!
```

### Manual Hook Setup

```bash
# Copy hooks from running container
docker cp claude-observability:/app/hooks ./my-project/.claude

# Update project name in settings
sed -i 's/cc-hooks-observability/my-project/g' ./my-project/.claude/settings.json

# Install dependencies
cd ./my-project/.claude/hooks
uv sync
```

## 🎯 Multi-Project Monitoring

The beauty of the Docker approach is **centralized monitoring**:

```bash
# One dashboard monitors ALL your projects
Projects monitored:
├── my-api-server      → Events with "my-api-server" label
├── frontend-app       → Events with "frontend-app" label  
├── cli-tool          → Events with "cli-tool" label
└── data-pipeline     → Events with "data-pipeline" label

# All visible in http://localhost:5173 with filtering by project
```

## 🔍 Troubleshooting

### Container Issues
```bash
# Check container status
docker ps
docker logs claude-observability

# Restart if needed
docker-compose restart
```

### Hook Issues
```bash
# Check if hooks can reach the server
curl http://localhost:4000/events/filter-options

# Test hook extraction
docker exec claude-observability ls -la /app/hooks

# Check Python dependencies in extracted hooks
cd ./your-project/.claude/hooks
uv sync
```

### LLM Issues
```bash
# Check which LLM is being used
tail -f ./your-project/.claude/logs/summarizer.log

# Common entries:
# "Using LLM provider: anthropic"
# "Anthropic call successful"
# "Using fallback summary generation"
```

## 💡 Best Practices

### 1. Project Naming
Use descriptive, consistent names:
```bash
./extract-hooks.sh ~/work/api-gateway "API Gateway"
./extract-hooks.sh ~/work/user-service "User Service"  
./extract-hooks.sh ~/personal/blog-site "Personal Blog"
```

### 2. LLM Provider Choice
- **Anthropic** (default): Faster, cheaper, excellent quality
- **OpenAI**: Alternative if you prefer GPT models or already have credits
- **Fallback**: Works without any LLM - basic but functional

### 3. Environment Management
```bash
# Project root .env (for Docker container)
ANTHROPIC_API_KEY=sk-ant-...
SUMMARY_LLM_PROVIDER=anthropic

# Each project can have its own .env too
# (hooks will find the nearest one)
```

## 🎉 Success Indicators

When everything is working correctly:

1. **Container Health**: `docker ps` shows `claude-observability` as healthy
2. **Dashboard Access**: http://localhost:5173 loads with events
3. **Hook Extraction**: `./extract-hooks.sh` completes without errors  
4. **Event Flow**: Running Claude Code in your project creates events in dashboard
5. **Smart Summaries**: Events show intelligent summaries (not just "Tool execution completed")

## 🔄 Updates & Maintenance

```bash
# Update the system
git pull
docker-compose build --no-cache
docker-compose up -d

# Re-extract hooks to projects (if hooks were updated)
./extract-hooks.sh /path/to/your/project "Project Name"
```

You now have a **production-ready, cross-platform, intelligent** observability system! 🤖✨