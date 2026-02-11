/**
 * Get the user's timezone using Intl API
 * Returns IANA timezone identifier (e.g., "America/New_York", "Europe/Warsaw")
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'UTC'; // Fallback to UTC
  }
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Get human-readable timezone name
 * e.g., "Eastern Standard Time" or "GMT+1"
 */
export function getTimezoneDisplayName(): string {
  try {
    const timezone = getUserTimezone();
    const now = new Date();
    const shortName = now.toLocaleTimeString('en-US', {
      timeZoneName: 'short',
      timeZone: timezone
    }).split(' ').pop();
    
    return shortName || timezone;
  } catch (error) {
    return 'UTC';
  }
}
