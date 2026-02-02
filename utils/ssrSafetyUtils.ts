/**
 * SSR Safety Utilities
 *
 * Collection of utility functions to help prevent SSR-related crashes
 * especially when working with GraphQL data that might be undefined during hydration.
 *
 * COMMON BUG PATTERN TO AVOID:
 * ❌ obj?.array.length === 0  // Missing optional chaining on .length access
 * ✅ obj?.array?.length === 0  // Proper optional chaining throughout
 *
 * The ESLint rule "no-unsafe-optional-chaining" should catch these patterns.
 */

/**
 * Safely get the first item from an array, with fallback
 * @param array - The array to get the first item from
 * @param fallback - Value to return if array is empty or undefined
 * @returns First array item or fallback
 */
export function safeArrayFirst<T>(
  array: T[] | undefined | null,
  fallback: T | null = null
): T | null {
  return Array.isArray(array) && array.length > 0
    ? array[0] || fallback
    : fallback;
}

/**
 * Safely get array length with fallback
 * @param array - The array to get length from
 * @param fallback - Value to return if array is undefined
 * @returns Array length or fallback
 */
export function safeArrayLength(
  array: unknown[] | undefined | null,
  fallback: number = 0
): number {
  return Array.isArray(array) ? array.length : fallback;
}

/**
 * Ensure a value is treated as an array, even if undefined
 * @param value - The value that should be an array
 * @returns The value if it's an array, empty array otherwise
 */
export function ensureArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely access nested properties that might be undefined during SSR
 * @param obj - The object to access
 * @param path - Dot-separated path to the property
 * @param fallback - Value to return if path doesn't exist
 * @returns Property value or fallback
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  fallback: T | null = null
): T | null {
  try {
    let current: unknown = obj;
    for (const key of path.split('.')) {
      if (current === null || current === undefined) {
        return fallback;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return (current ?? fallback) as T | null;
  } catch {
    return fallback;
  }
}

/**
 * Check if we're running on the client side
 * @returns true if running in browser, false if SSR
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Execute a function only on the client side
 * @param fn - Function to execute
 * @param fallback - Value to return during SSR
 * @returns Function result or fallback
 */
export function clientOnly<T>(
  fn: () => T,
  fallback: T | null = null
): T | null {
  return isClient() ? fn() : fallback;
}

/**
 * Validate GraphQL discussion data and ensure required arrays exist
 * @param discussion - Discussion object from GraphQL
 * @returns Normalized discussion with guaranteed array properties
 */
export function validateDiscussionData<
  T extends {
    DownloadableFiles?: unknown[] | null;
    DiscussionChannels?: unknown[] | null;
  },
>(
  discussion: T | null | undefined
): (T & { DownloadableFiles: unknown[]; DiscussionChannels: unknown[] }) | null {
  if (!discussion) return null;

  return {
    ...discussion,
    DownloadableFiles: ensureArray(discussion.DownloadableFiles),
    DiscussionChannels: ensureArray(discussion.DiscussionChannels),
  };
}

/**
 * Validate GraphQL event data and ensure required arrays exist
 * @param event - Event object from GraphQL
 * @returns Normalized event with guaranteed array properties
 */
export function validateEventData<T extends { EventChannels?: unknown[] | null }>(
  event: T | null | undefined
): (T & { EventChannels: unknown[] }) | null {
  if (!event) return null;

  return {
    ...event,
    EventChannels: ensureArray(event.EventChannels),
  };
}
