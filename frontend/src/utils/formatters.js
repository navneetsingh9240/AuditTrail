/**
 * Formatting utilities for AuditTrail frontend dashboard
 */

/**
 * Format timestamp into human-readable date and time string
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const d = new Date(timestamp);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Truncate SHA-256 hash for UI display (e.g., 0xa3b8...f8a7)
 */
export function truncateHash(hash, lead = 8, tail = 6) {
  if (!hash) return 'GENESIS';
  if (hash.length <= lead + tail) return hash;
  return `${hash.substring(0, lead)}...${hash.substring(hash.length - tail)}`;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius) {
  if (celsius === null || celsius === undefined) return 'N/A';
  return ((celsius * 9) / 5 + 32).toFixed(1);
}

/**
 * Format event type into human-friendly capitalized string
 */
export function formatEventType(eventType) {
  if (!eventType) return 'UNKNOWN EVENT';
  return eventType.replace(/_/g, ' ').toUpperCase();
}

/**
 * Format version number string
 */
export function formatVersion(version) {
  return `v${version || 0}`;
}
