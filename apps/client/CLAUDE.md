# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **client application** for the Multi-Agent Observability System - a real-time monitoring and visualization dashboard for Claude Code agents. The client is a Vue 3 TypeScript application that connects via WebSocket to display Claude Code hook events in real-time.

## Architecture

- **Framework**: Vue 3 with Composition API and `<script setup>` syntax
- **Language**: TypeScript with strict type checking
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with extensive custom theme system
- **UI Components**: shadcn-vue component library (migrated from nuxt-ui)
- **Charts**: @unovis/vue for data visualization
- **Real-time**: WebSocket connection to server at `ws://localhost:4000/stream`

## Development Commands

### Core Commands
```bash
# Development server (port 5173)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking (no build)
vue-tsc -b
```

### System Commands (from project root)
```bash
# Start both client and server
./scripts/start-system.sh

# Stop all processes and optionally clear database
./scripts/reset-system.sh

# Test event sending
./scripts/test-system.sh
```

### Testing
```bash
# Run Vitest tests
bun test

# Run single test file
bun test src/components/__tests__/EventRow.test.ts
```

## Key Architecture Patterns

### Component Structure
- **App.vue**: Main application shell with WebSocket management, theme system, and filtering
- **EventTimeline.vue**: Scrollable event feed with virtual scrolling considerations
- **EventRow.vue**: Individual event display with sophisticated color coding
- **EventHeaderPulse.vue**: Real-time activity chart using canvas rendering
- **UI Components**: Located in `src/components/ui/` following shadcn-vue structure

### State Management
- **Reactive Refs**: Vue 3 composition API for local state
- **Composables**: Reusable logic in `src/composables/`
  - `useWebSocket.ts`: WebSocket connection and event management
  - `useThemes.ts`: Theme system with auto/manual theme switching
  - `useEventColors.ts`: Dynamic color assignment for sessions/apps
  - `useChartData.ts`: Real-time chart data processing

### Data Flow
```
WebSocket Server → useWebSocket → Events Array → Filters → UI Components
```

## Component Migration Notes

The project has migrated from nuxt-ui to shadcn-vue components:
- All badge/chip elements now use `<Badge>` component with variants: `outline`, `solid`, `soft`
- Button components use `<Button>` with proper variants and sizing
- Form components use shadcn-vue Select, Input, etc.
- Testing validates proper migration in `src/components/__tests__/EventRow.test.ts`

## Real-time Features

### WebSocket Connection
- Auto-connects to `ws://localhost:4000/stream` on mount
- Handles reconnection with 3-second delay
- Receives initial events batch and real-time updates
- Event limit: Configurable via `VITE_MAX_EVENTS_TO_DISPLAY` (default: 100)

### Event Types
- **PreToolUse**: Before tool execution (🔧)
- **PostToolUse**: After tool completion (✅)
- **UserPromptSubmit**: User prompt submission (💬)
- **Stop**: Response completion (🛑)
- **SubagentStop**: Subagent finished (👥)
- **Notification**: User interactions (🔔)
- **PreCompact**: Context compaction (📦)

### Color System
Events use dual-color coding:
- **Session Colors**: Consistent per session ID
- **App Colors**: Consistent per source application
- **Visual Indicators**: Left border (app), second border (session)

## Theme System

### Built-in Themes
- Light/Dark mode with auto-detection
- CSS custom properties: `--theme-*` variables
- Comprehensive color palette in `tailwind.config.js`
- Theme persistence in localStorage

### Custom Theme Support
- Theme creation and management UI
- Export/import functionality
- Server-side theme storage
- Public/private theme sharing

## Environment Configuration

### Client (.env)
```bash
VITE_MAX_EVENTS_TO_DISPLAY=100  # Event display limit
```

### Development Ports
- **Client**: 5173 (Vite dev server)
- **Server**: 4000 (WebSocket + HTTP API)

## File Structure Conventions

```
src/
├── components/
│   ├── ui/                 # shadcn-vue components
│   ├── EventTimeline.vue   # Main event feed
│   ├── EventRow.vue        # Individual event display
│   └── __tests__/         # Component tests
├── composables/           # Reusable Vue logic
├── utils/                 # Helper functions
├── types.ts              # TypeScript interfaces
└── main.ts               # Application entry
```

## TypeScript Integration

- **Strict Mode**: Enabled with comprehensive type checking
- **Path Aliases**: `@/*` maps to `src/*`
- **Component Types**: Full typing for Vue SFCs
- **API Types**: Shared interfaces in `types.ts`

## Testing Strategy

- **Framework**: Vitest with jsdom environment
- **Component Testing**: Vue Test Utils for component isolation
- **Coverage Focus**: Badge migration validation, WebSocket handling
- **Mock Strategy**: UI components mocked for focused testing

## Performance Considerations

- **Event Limiting**: Automatic cleanup when exceeding `VITE_MAX_EVENTS_TO_DISPLAY`
- **Canvas Rendering**: Direct canvas manipulation for charts
- **CSS Optimization**: Tailwind purging with safelist for dynamic classes
- **Bundle Splitting**: Vite automatic code splitting

## Integration Points

### Server Communication
- **Event Reception**: POST from hook scripts to server, then WebSocket broadcast
- **Filtering API**: GET `/events/recent` with query parameters
- **Theme API**: Full CRUD operations for custom themes

### Claude Code Hooks
Events originate from `.claude/hooks/send_event.py` scripts configured in project settings. The client visualizes these events with full context including:
- Tool names and parameters
- Execution results and outputs
- Session and conversation tracking
- Chat transcript integration