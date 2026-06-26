/**
 * Small, generic array helpers shared across the codebase. Several modules
 * previously each defined their own "toggle membership" helper
 * (toggleArrayItem, toggleSelectedTag, toggleInArray) with identical logic;
 * this is the single canonical implementation they now re-export.
 */

/**
 * Return a new array with `value` removed if present, or appended if absent.
 */
export function toggleInArray<T>(array: T[], value: T): T[] {
  const index = array.indexOf(value);
  if (index === -1) {
    return [...array, value];
  }
  return array.filter((_, i) => i !== index);
}
