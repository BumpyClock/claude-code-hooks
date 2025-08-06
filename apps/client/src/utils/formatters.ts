/**
 * Formatting utility functions for consistent data presentation
 */

/**
 * Format a timestamp as a readable time string
 * @param timestamp - Unix timestamp in milliseconds or ISO string
 * @returns Formatted time string (e.g., "2:30:45 PM")
 */
export function formatTime(timestamp?: number | string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Format a timestamp with consistent formatting across components
 * @param timestamp - Unix timestamp in milliseconds or ISO string  
 * @returns Formatted timestamp string
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

/**
 * Truncate an ID or string to a specified length with ellipsis
 * @param id - The string to truncate
 * @param length - Maximum length before truncation (default: 8)
 * @returns Truncated string with ellipsis if needed
 */
export function truncateId(id: string, length: number = 8): string {
  if (!id) return '';
  return id.length > length ? `${id.slice(0, length)}...` : id;
}

/**
 * Truncate text content with smart word boundary detection
 * @param text - Text to truncate
 * @param maxLength - Maximum character length
 * @param maxLines - Maximum number of lines
 * @returns Object with truncated text and truncation status
 */
export function truncateText(
  text: string, 
  maxLength: number = 500, 
  maxLines: number = 4
): { text: string; isTruncated: boolean } {
  if (!text) return { text: '', isTruncated: false };

  const lines = text.split('\n');
  
  // If content is short enough, return as-is
  if (lines.length <= maxLines && text.length <= maxLength) {
    return { text, isTruncated: false };
  }
  
  // Truncate by lines first
  let truncated = lines.slice(0, maxLines).join('\n');
  
  // Further truncate by characters if needed
  if (truncated.length > maxLength) {
    truncated = truncated.slice(0, maxLength);
    // Try to break at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      truncated = truncated.slice(0, lastSpace);
    }
  }
  
  return { text: truncated + '...', isTruncated: true };
}

/**
 * Format a file path to show just the filename
 * @param filePath - Full file path
 * @returns Just the filename portion
 */
export function getFilename(filePath?: string): string {
  if (!filePath) return '';
  return filePath.split('/').pop() || '';
}

/**
 * Format command text for display (truncate with ellipsis)
 * @param command - Command string
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Truncated command string
 */
export function formatCommand(command: string, maxLength: number = 50): string {
  if (!command) return '';
  return command.length > maxLength 
    ? command.slice(0, maxLength) + '...' 
    : command;
}