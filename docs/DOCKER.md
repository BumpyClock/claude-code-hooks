# Docker Deployment Guide

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY="your-api-key-here"

# 2. Start the system
docker-compose up -d

# 3. Access the UI
open http://localhost:5173
```

### Option 2: Automated Script

```bash
chmod +x docker-run.sh
./docker-run.sh
```

### Option 3: Manual Docker Run

```bash
docker run -d \
  --name claude-observability \
  -p 4000:4000 \
  -p 5173:5173 \
  -e ANTHROPIC_API_KEY="your-api-key-here" \
  -v claude-observability-data:/app/data \
  --restart unless-stopped \
  claude-observability
```

## Building from Source

```bash
# Build the image
docker build -t claude-observability .

# Run with custom configuration
docker run -d \
  --name claude-observability \
  -p 4000:4000 \
  -p 5173:5173 \
  --env-file .env \
  -v claude-observability-data:/app/data \
  claude-observability
```

## Container Management

```bash
# View logs
docker logs -f claude-observability

# Stop container
docker stop claude-observability

# Start container
docker start claude-observability

# Restart container
docker restart claude-observability

# Remove container
docker rm -f claude-observability

# Remove volume (deletes all data!)
docker volume rm claude-observability-data
```

## Extracting Hooks for Other Projects

```bash
# Copy hooks from running container
docker cp claude-observability:/app/hooks ./my-project/.claude

# Or from built image
docker create --name temp claude-observability
docker cp temp:/app/hooks ./my-project/.claude
docker rm temp
```

## Environment Configuration

Create `.env` file:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional
ENGINEER_NAME=Your Name
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ELEVEN_API_KEY=your_elevenlabs_key

# System
LOG_LEVEL=info
MAX_EVENT_HISTORY=1000
```

## Health Checks

The container includes built-in health checks:

```bash
# Check container health status
docker ps

# Manual health check
curl -f http://localhost:4000/events/filter-options
```

## Troubleshooting

### Container won't start
```bash
# Check logs for errors
docker logs claude-observability

# Common issues:
# 1. Port conflicts - stop other services on 4000/5173
# 2. Missing API key - check environment variables
# 3. Insufficient memory - free up system resources
```

### Cannot access UI
```bash
# Verify ports are mapped correctly
docker port claude-observability

# Check if services are running inside container
docker exec claude-observability curl localhost:5173
docker exec claude-observability curl localhost:4000/events/filter-options
```

### Database issues
```bash
# Check volume mounting
docker volume inspect claude-observability-data

# Reset database (deletes all data!)
docker volume rm claude-observability-data
```

## Production Deployment

For production use:

```yaml
version: '3.8'
services:
  observability:
    image: claude-observability:latest
    restart: always
    ports:
      - "4000:4000"
      - "5173:5173"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NODE_ENV=production
      - LOG_LEVEL=warn
    volumes:
      - observability-data:/app/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/events/filter-options"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```