# Project File Structure

## 📁 Root Directory

```
claude-code-hooks/
├── 🚀 start.sh                    # Universal starter script (Docker + Local)
├── 📋 README.md                   # Main project documentation
├── 🐳 Dockerfile                  # Multi-stage Docker build
├── 🐳 docker-compose.yml          # Docker orchestration
├── 📄 .env.sample                 # Environment template
├── 📄 .dockerignore               # Docker build exclusions
└── 📄 CLAUDE.md                   # Claude Code instructions
```

## 📁 Key Directories

### `/apps/` - Core Applications
```
apps/
├── server/                        # Bun TypeScript API server
│   ├── src/index.ts               # Main server + WebSocket
│   ├── src/db.ts                  # SQLite database layer
│   └── package.json
└── client/                        # Vue 3 TypeScript dashboard
    ├── src/App.vue                # Main app with WebSocket
    ├── src/components/            # UI components
    └── package.json
```

### `/setup/` - Installation & Setup Scripts
```
setup/
├── install.sh                     # Full local development installer
├── docker-run.sh                  # Interactive Docker runner
└── extract-hooks.sh               # Hook extraction for projects
```

### `/scripts/` - Development Utilities
```
scripts/
├── start-system.sh                # Start local dev servers
├── reset-system.sh                # Stop processes + cleanup
└── test-system.sh                 # System validation tests
```

### `/.claude/` - Claude Code Integration
```
.claude/
├── settings.json                  # Hook configuration
└── hooks/                         # Python hook scripts
    ├── send_event.py              # Universal event sender
    ├── utils/summarizer.py        # Smart LLM summarization
    └── utils/llm/                 # LLM provider modules
```

### `/docs/` - Documentation
```
docs/
├── DOCKER.md                      # Docker deployment guide
├── DOCKER-USAGE.md                # Complete Docker workflow
├── FILE-STRUCTURE.md              # This file
├── AGENTS.md                      # Agent system docs
├── GEMINI.md                      # Gemini integration
└── CRUSH.md                       # Additional notes
```

## 🎯 Quick Access

### For Users (Getting Started)
- **🚀 `./start.sh`** - Universal starter (detects Docker/Local)
- **📋 `README.md`** - Complete setup instructions
- **🐳 `docker-compose up -d`** - Direct Docker start

### For Developers
- **⚙️ `./setup/install.sh`** - Local development setup
- **🔧 `./scripts/start-system.sh`** - Local dev server start
- **📚 `/docs/DOCKER-USAGE.md`** - Complete Docker workflow

### For Project Integration
- **🪝 `./setup/extract-hooks.sh`** - Add monitoring to any project
- **⚙️ `.env.sample`** - Environment configuration template

## 📋 File Categories

### Essential (Keep)
- `start.sh` - Universal entry point
- `README.md` - Main documentation
- `docker-compose.yml` - Docker orchestration
- `Dockerfile` - Container build
- `.env.sample` - Configuration template

### Installation (Organized)
- `setup/install.sh` - Local installer
- `setup/docker-run.sh` - Docker helper
- `setup/extract-hooks.sh` - Hook integration

### Documentation (Consolidated)
- `docs/DOCKER*.md` - Docker guides
- `docs/FILE-STRUCTURE.md` - This overview
- `docs/AGENTS.md` - System internals

### Development (Existing)
- `scripts/` - Development utilities
- `apps/` - Core applications
- `.claude/` - Hook integration

This structure provides:
- ✅ **Clear entry points** for different user types
- ✅ **Organized setup scripts** by purpose
- ✅ **Consolidated documentation** in `/docs/`
- ✅ **Preserved development workflow** in `/scripts/`
- ✅ **Clean root directory** with essentials only