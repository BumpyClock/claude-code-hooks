# Multi-Machine Claude Code Usage Monitoring System

## Project Overview

Transform the current single-machine Claude Code monitoring dashboard into a distributed system where one central server aggregates token usage and session information from multiple client machines.

## Current Architecture Analysis

### How ccusage Works
- **Data Source**: Reads JSONL files from Claude data directories (`~/.claude/projects/` or `~/.config/claude/projects/`)
- **Token Detection**: Each JSONL line contains timestamp, usage tokens (input/output/cache), model, pre-calculated costs
- **Efficiency**: Uses `LiveMonitor` class with file change detection - only processes new/modified files
- **Session Blocks**: Groups usage into 5-hour billing windows with active block monitoring
- **Burn Rate**: Calculates tokens/min from recent activity using sliding time windows

### Current Limitation
- All data processing happens on the same machine where JSONL files exist
- No network communication or data sharing between machines
- Dashboard can only monitor local Claude Code usage

## Distributed Architecture Solution

### Core Design Philosophy
**Leverage existing ccusage logic rather than reimplementing token detection**

### Data Flow Architecture
```
[Client Machine A] → ccusage LiveMonitor → WebSocket Stream → [Central Server] ← WebSocket Stream ← ccusage LiveMonitor ← [Client Machine B]
                                                                      ↓
                                                               Aggregation Engine
                                                                      ↓
                                                               [Multi-Client Dashboard]
```

## Implementation Phases

### Phase 1: Client Data Collector Service

**Goal**: Create lightweight service that runs on each client machine

#### Technical Specifications
- **Location**: New package `apps/client-collector/`
- **Dependencies**: 
  - ccusage (npm library)
  - WebSocket client
  - Configuration management
- **Core Components**:
  - LiveMonitor wrapper
  - WebSocket client for data streaming
  - Auto-discovery of Claude data directories
  - Network interruption handling

#### Client Configuration
```typescript
interface ClientConfig {
  serverUrl: string          // ws://central-server:4000
  clientId: string          // machine hostname or custom ID
  authToken?: string        // Optional authentication
  syncInterval: number      // How often to sync data (default: 30s)
  claudeDataPaths?: string[] // Override auto-detection
}
```

#### Data Collection Strategy
- Wrap ccusage's existing `LiveMonitor` class
- Stream individual usage entries as they're detected
- Send pre-calculated session blocks for efficiency
- Handle client disconnections gracefully with local caching

### Phase 2: Enhanced Central Server

**Goal**: Extend existing server to aggregate multi-client data

#### Server Enhancements
- **Location**: Enhance existing `apps/server/src/`
- **New API Endpoints**:
  - `POST /api/clients/register` - Client registration and authentication
  - `GET /api/usage/distributed` - Multi-client aggregated usage data
  - `GET /api/clients` - List connected clients with status
  - `GET /api/usage/client/:clientId` - Per-client detailed usage

#### WebSocket Protocol Design
```typescript
// Client → Server Messages
interface UsageEntryMessage {
  type: "usage_entry"
  clientId: string
  timestamp: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  }
  model: string
  costUSD: number
  projectPath: string
  sessionId: string
}

interface SessionBlockMessage {
  type: "session_block_update"
  clientId: string
  sessionBlock: {
    id: string
    startTime: string
    endTime: string
    isActive: boolean
    tokenCounts: TokenCounts
    burnRate?: BurnRate
    projection?: ProjectedUsage
  }
}

interface ClientHeartbeat {
  type: "heartbeat"
  clientId: string
  timestamp: string
  status: "active" | "idle"
}

// Server → Client Messages
interface ServerAcknowledge {
  type: "ack"
  messageId: string
  status: "received" | "processed" | "error"
}
```

#### Database Schema Updates
```sql
-- Client registration and tracking
CREATE TABLE IF NOT EXISTS clients (
  client_id TEXT PRIMARY KEY,
  hostname TEXT,
  first_connected TIMESTAMP,
  last_heartbeat TIMESTAMP,
  is_online BOOLEAN DEFAULT TRUE,
  config JSON
);

-- Aggregated usage data from all clients
CREATE TABLE IF NOT EXISTS distributed_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT,
  timestamp TIMESTAMP,
  usage_data JSON,
  session_block_id TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

-- Client session blocks for historical tracking
CREATE TABLE IF NOT EXISTS client_session_blocks (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_active BOOLEAN,
  token_counts JSON,
  burn_rate JSON,
  projection JSON,
  FOREIGN KEY (client_id) REFERENCES clients(client_id)
);
```

#### Multi-Client Aggregation Logic
```typescript
interface ClientState {
  clientId: string
  lastHeartbeat: Date
  liveMonitor: LiveMonitor // Per-client ccusage state
  sessionBlocks: SessionBlock[]
  isOnline: boolean
  metadata: {
    hostname: string
    version: string
    claudeDataPaths: string[]
  }
}

// Server maintains map of all client states
class MultiClientAggregator {
  private clients = new Map<string, ClientState>()

  // Calculate global burn rate across all clients
  calculateGlobalBurnRate(): number {
    return Array.from(this.clients.values())
      .filter(client => client.isOnline)
      .reduce((sum, client) => {
        const activeBlock = client.sessionBlocks.find(b => b.isActive)
        return sum + (activeBlock?.burnRate?.tokensPerMinute || 0)
      }, 0)
  }

  // Get aggregated session blocks across time periods
  getAggregatedSessions(timeRange: TimeRange): AggregatedSession[] {
    // Merge session blocks from all clients by time windows
    // Maintain client attribution for detailed breakdowns
  }
}
```

### Phase 3: Multi-Client Dashboard

**Goal**: Update dashboard for distributed monitoring capabilities

#### Dashboard Enhancements
- **Client Selector**: Dropdown to filter/view specific machines
- **Global Views**: 
  - Total burn rate across all connected clients
  - Aggregated token usage trends
  - Multi-machine session timeline
- **Per-Client Views**:
  - Individual machine detailed analytics
  - Client connection status indicators
  - Per-client session block breakdowns

#### UI Component Updates
```typescript
// New components needed
- ClientSelector.vue          // Machine filter dropdown
- GlobalBurnRateCard.vue     // Aggregated burn rate display
- ClientStatusIndicator.vue   // Online/offline status per client
- MultiClientSessionView.vue  // Cross-client session tracking
- DistributedTokenModal.vue   // Enhanced modal with client breakdowns
```

#### Dashboard Data Flow
```typescript
// Enhanced WebSocket connection for dashboard
interface DashboardMessage {
  type: "global_update"
  data: {
    globalBurnRate: number
    activeClients: number
    totalSessions: number
    aggregatedBlocks: SessionBlock[]
    clientStates: ClientState[]
  }
}
```

## Technical Implementation Details

### Storage Strategy
- **SQLite**: Client registration, historical aggregated data, configuration
- **In-Memory**: Live monitoring states (following ccusage's efficient pattern)
- **Hybrid Sync**: Periodic dumps to SQLite for persistence and recovery

### Scalability Considerations
- **Connection Management**: Efficient WebSocket connection pooling
- **Memory Management**: Per-client state isolation to prevent memory leaks
- **Performance**: Lazy loading of historical data, efficient aggregation algorithms
- **Target Capacity**: Support for 20-50 concurrent client machines

### Authentication & Security
- **Client Authentication**: Optional token-based authentication for client registration
- **Network Security**: WSS (WebSocket Secure) support for production deployments
- **Data Privacy**: Client data isolation, configurable data retention policies

### Error Handling & Resilience
- **Network Interruptions**: Client-side buffering and retry logic
- **Server Restart**: Persistent client state recovery from database
- **Partial Failures**: Graceful degradation when some clients are offline

## Deployment Strategy

### Development Environment
1. **Local Testing**: All components running on single machine with different ports
2. **Docker Compose**: Containerized setup for easier multi-machine simulation
3. **Configuration**: Environment-based configuration for server URLs and client settings

### Production Deployment Options

#### Option 1: Docker Containers
```yaml
# docker-compose.yml
version: '3.8'
services:
  central-server:
    build: ./apps/server
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/data/monitoring.db
    volumes:
      - monitoring-data:/data

  client-collector:
    build: ./apps/client-collector
    environment:
      - SERVER_URL=ws://central-server:4000
      - CLIENT_ID=${HOSTNAME}
      - CLAUDE_DATA_PATHS=/home/.claude/projects
    volumes:
      - ${HOME}/.claude:/home/.claude:ro
```

#### Option 2: System Services
- **Windows**: Windows Service wrapper
- **Linux/macOS**: systemd/launchd service configurations
- **Cross-platform**: PM2 or similar process manager

### Configuration Management
```typescript
// Shared configuration schema
interface SystemConfig {
  server: {
    port: number
    wsPort: number
    database: string
    authentication: {
      enabled: boolean
      secretKey?: string
    }
  }
  client: {
    serverUrl: string
    clientId: string
    syncInterval: number
    retryAttempts: number
    authToken?: string
  }
}
```

## Migration Path

### Backward Compatibility
- **Existing Single-Machine Mode**: Continue to work unchanged
- **Gradual Migration**: Users can opt-in to distributed mode
- **Configuration Flags**: Environment variables to enable/disable distributed features

### Migration Steps
1. **Phase 1 Deployment**: Add client collector to existing installations
2. **Phase 2 Deployment**: Upgrade server with multi-client support
3. **Phase 3 Deployment**: Update dashboard with distributed views
4. **Testing Phase**: Comprehensive testing with multiple client machines
5. **Production Rollout**: Gradual rollout with monitoring and rollback plans

## Success Metrics

### Performance Metrics
- **Latency**: < 1s for client data to appear in dashboard
- **Throughput**: Support 50+ concurrent clients without degradation
- **Resource Usage**: < 100MB memory per client collector service
- **Reliability**: 99.9% uptime for data collection

### User Experience Metrics
- **Setup Time**: < 5 minutes to add new client machine
- **Dashboard Responsiveness**: All views load within 2 seconds
- **Data Accuracy**: 100% consistency between ccusage CLI and distributed dashboard

## Risks & Mitigation

### Technical Risks
- **Network Reliability**: Mitigation via client-side buffering and retry logic
- **Data Consistency**: Mitigation via timestamp-based conflict resolution
- **Scalability Limits**: Mitigation via performance testing and optimization

### Operational Risks
- **Complex Deployment**: Mitigation via Docker containerization and documentation
- **Configuration Errors**: Mitigation via validation and sensible defaults
- **Security Concerns**: Mitigation via optional authentication and secure defaults

## Next Steps

### Immediate Actions (Sprint 1)
1. ✅ Create sprint documentation
2. Set up client-collector package structure
3. Design and implement WebSocket protocol
4. Create basic client registration system

### Short Term (Sprints 2-3)
1. Implement LiveMonitor wrapper in client collector
2. Add multi-client WebSocket handlers to server
3. Create database schema and migration scripts
4. Build basic multi-client dashboard views

### Medium Term (Sprints 4-6)
1. Add authentication and security features
2. Implement comprehensive error handling
3. Create deployment documentation and Docker configurations
4. Performance testing and optimization

### Long Term (Post-MVP)
1. Advanced analytics and reporting features
2. Client management and monitoring tools
3. Integration with CI/CD pipelines
4. Enterprise features (RBAC, audit logging)

---

**Project Status**: Planning Complete ✅  
**Next Sprint**: Client Data Collector Implementation  
**Target Timeline**: 6-8 weeks for full implementation  
**Team**: Burt Macklin & Claude Code Assistant