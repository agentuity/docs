/**
 * Utility functions for working with dates in the chat application
 */

/**
 * Converts a Date object or timestamp string to ISO string format
 * @param date Date object or string to convert
 * @returns ISO string representation
 */
export function toISOString(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) {
    return new Date().toISOString();
  }
  return dateObj.toISOString();
}

/**
 * Formats a timestamp for display in the UI
 * @param timestamp ISO string timestamp
 * @param options Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  timestamp: string,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  return new Date(timestamp).toLocaleTimeString([], options);
}

/**
 * Creates a current timestamp in ISO format
 * @returns Current time as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}