/**
 * Utility functions for localStorage that disambiguates keys by base URL
 * This prevents data from different environments (localhost vs hosted) from interfering with each other
 */

/**
 * Gets the base URL for the current environment to use as a prefix for localStorage keys
 * @returns string - The base URL (e.g., 'localhost:3000' or 'topical.space')
 */
const getBaseUrlPrefix = (): string => {
  if (!import.meta.client) {
    return 'ssr';
  }

  const url = new URL(window.location.href);
  return url.host; // This gives us 'localhost:3000' or 'topical.space' etc.
};

/**
 * Creates a disambiguated localStorage key by prefixing with the base URL
 * @param key - The original localStorage key
 * @returns string - The prefixed key (e.g., 'localhost:3000:recentForums')
 */
const createDisambiguatedKey = (key: string): string => {
  const prefix = getBaseUrlPrefix();
  return `${prefix}:${key}`;
};

/**
 * Gets an item from localStorage using a disambiguated key
 * @param key - The original localStorage key
 * @param defaultValue - Default value to return if key doesn't exist
 * @returns The parsed JSON value or the default value
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!import.meta.client) {
    return defaultValue;
  }

  try {
    const disambiguatedKey = createDisambiguatedKey(key);
    const item = localStorage.getItem(disambiguatedKey);

    if (item === null) {
      return defaultValue;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error parsing localStorage item for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Sets an item in localStorage using a disambiguated key
 * @param key - The original localStorage key
 * @param value - The value to store (will be JSON stringified)
 */
export const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (!import.meta.client) {
    return;
  }

  try {
    const disambiguatedKey = createDisambiguatedKey(key);
    localStorage.setItem(disambiguatedKey, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage item for key "${key}":`, error);
  }
};

/**
 * Removes an item from localStorage using a disambiguated key
 * @param key - The original localStorage key
 */
export const removeLocalStorageItem = (key: string): void => {
  if (!import.meta.client) {
    return;
  }

  const disambiguatedKey = createDisambiguatedKey(key);
  localStorage.removeItem(disambiguatedKey);
};

/**
 * Clears all localStorage items for the current base URL
 * @param keyPrefix - Optional prefix to only clear items starting with this prefix
 */
export const clearLocalStorageForCurrentSite = (keyPrefix?: string): void => {
  if (!import.meta.client) {
    return;
  }

  const basePrefix = getBaseUrlPrefix();
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (key.startsWith(`${basePrefix}:`)) {
      if (!keyPrefix || key.startsWith(`${basePrefix}:${keyPrefix}`)) {
        localStorage.removeItem(key);
      }
    }
  });
};
