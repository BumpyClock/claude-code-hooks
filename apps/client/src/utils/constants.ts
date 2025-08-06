/**
 * Application-wide constants and configuration values
 */

// ==================== TIMING CONSTANTS ====================

/**
 * Window size in milliseconds for event aggregation
 * Used in EventTimeline to group events within this time window
 */
export const WINDOW_MS = 3000;

/**
 * Debounce delay in milliseconds for input handling
 * Used to prevent excessive API calls or state updates
 */
export const DEBOUNCE_DELAY = 300;

/**
 * Fast debounce delay for high-frequency events like chart updates
 */
export const FAST_DEBOUNCE_DELAY = 50;

/**
 * Standard timeout for copy feedback states
 */
export const COPY_FEEDBACK_TIMEOUT = 2000;

// ==================== TEXT TRUNCATION CONSTANTS ====================

/**
 * Maximum character length for text truncation
 * Used across components for consistent text display
 */
export const MAX_TRUNCATE_LENGTH = 500;

/**
 * Default maximum lines for text truncation
 * Used in CollapsibleMessage and similar components
 */
export const DEFAULT_TRUNCATE_LINES = 4;

/**
 * Maximum characters for command display
 */
export const MAX_COMMAND_LENGTH = 50;

/**
 * Maximum characters for file path display before showing just filename
 */
export const MAX_FILEPATH_LENGTH = 100;

/**
 * Maximum length for session ID display before truncation
 */
export const SESSION_ID_DISPLAY_LENGTH = 8;

// ==================== UI LAYOUT CONSTANTS ====================

/**
 * Standard spacing values for consistent layout
 */
export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem', 
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem'
} as const;

/**
 * Standard border radius values
 */
export const BORDER_RADIUS = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem'
} as const;

// ==================== EVENT TYPE CONSTANTS ====================

/**
 * Hook event types used throughout the application
 */
export const EVENT_TYPES = {
  PRE_TOOL_USE: 'PreToolUse',
  POST_TOOL_USE: 'PostToolUse', 
  NOTIFICATION: 'Notification',
  STOP: 'Stop',
  PRE_COMPACT: 'PreCompact',
  USER_PROMPT_SUBMIT: 'UserPromptSubmit'
} as const;

/**
 * Tool name constants for consistent identification
 */
export const TOOL_NAMES = {
  READ: 'Read',
  WRITE: 'Write',
  MULTI_EDIT: 'MultiEdit',
  TODO_WRITE: 'TodoWrite',
  BASH: 'Bash',
  GREP: 'Grep',
  GLOB: 'Glob',
  EXIT_PLAN_MODE: 'ExitPlanMode'
} as const;

// ==================== CHART CONSTANTS ====================

/**
 * Time range configurations for charts
 */
export const CHART_TIME_RANGES = {
  '15s': {
    duration: 15 * 1000,
    bucketSize: 1000,
    maxPoints: 15
  },
  '30s': {
    duration: 30 * 1000,
    bucketSize: 1000, 
    maxPoints: 30
  },
  '1m': {
    duration: 60 * 1000,
    bucketSize: 1000,
    maxPoints: 60
  },
  '3m': {
    duration: 3 * 60 * 1000,
    bucketSize: 3000,
    maxPoints: 60
  },
  '5m': {
    duration: 5 * 60 * 1000,
    bucketSize: 5000,
    maxPoints: 60
  }
} as const;

// ==================== COLOR CONSTANTS ====================

/**
 * Standard color palette for event visualization
 */
export const EVENT_COLORS = [
  'bg-blue-500',
  'bg-green-500', 
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500'
] as const;

/**
 * Status colors for UI feedback
 */
export const STATUS_COLORS = {
  SUCCESS: 'text-green-500',
  ERROR: 'text-red-500', 
  WARNING: 'text-yellow-500',
  INFO: 'text-blue-500'
} as const;

// ==================== API CONSTANTS ====================

/**
 * Default API endpoint configurations
 */
export const API_ENDPOINTS = {
  WEBSOCKET: 'ws://localhost:4001',
  REST_BASE: 'http://localhost:4000',
  FILTER_OPTIONS: '/events/filter-options'
} as const;

/**
 * WebSocket reconnection settings
 */
export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000
} as const;

// ==================== FILE SIZE CONSTANTS ====================

/**
 * File size limits and thresholds
 */
export const FILE_SIZE = {
  MAX_DISPLAY_SIZE: 1024 * 1024, // 1MB
  TRUNCATE_THRESHOLD: 10000, // 10KB
  CHUNK_SIZE: 1024 // 1KB chunks for streaming
} as const;

// ==================== VALIDATION CONSTANTS ====================

/**
 * Input validation patterns and limits
 */
export const VALIDATION = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  SESSION_ID_PATTERN: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  HEX_COLOR_PATTERN: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
} as const;

// ==================== TYPE EXPORTS ====================

/**
 * Type-only exports for TypeScript
 */
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES]; 
export type EventColor = typeof EVENT_COLORS[number];
export type StatusColor = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];
export type TimeRangeKey = keyof typeof CHART_TIME_RANGES;