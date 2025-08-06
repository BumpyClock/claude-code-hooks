/**
 * Utility functions and constants for the Claude Code Hooks client
 * 
 * This barrel export makes it easy to import utilities throughout the app:
 * 
 * @example
 * ```typescript
 * import { formatTime, colorUtils, WINDOW_MS } from '@/utils'
 * ```
 */

// Re-export all formatter utilities
export {
  formatTime,
  formatTimestamp, 
  truncateId,
  truncateText,
  getFilename,
  formatCommand
} from './formatters';

// Re-export all style helper utilities
export {
  colorUtils,
  animationUtils,
  stylePatterns
} from './styleHelpers';

// Re-export all constants
export {
  // Timing constants
  WINDOW_MS,
  DEBOUNCE_DELAY,
  FAST_DEBOUNCE_DELAY,
  COPY_FEEDBACK_TIMEOUT,

  // Text truncation constants  
  MAX_TRUNCATE_LENGTH,
  DEFAULT_TRUNCATE_LINES,
  MAX_COMMAND_LENGTH,
  MAX_FILEPATH_LENGTH,
  SESSION_ID_DISPLAY_LENGTH,

  // UI constants
  SPACING,
  BORDER_RADIUS,

  // Event constants
  EVENT_TYPES,
  TOOL_NAMES,

  // Chart constants  
  CHART_TIME_RANGES,

  // Color constants
  EVENT_COLORS,
  STATUS_COLORS,

  // API constants
  API_ENDPOINTS,
  WEBSOCKET_CONFIG,

  // File constants
  FILE_SIZE,

  // Validation constants
  VALIDATION
} from './constants';

// Re-export types
export type {
  EventType,
  ToolName,
  EventColor,
  StatusColor,
  TimeRangeKey
} from './constants';