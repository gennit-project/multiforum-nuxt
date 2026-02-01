/**
 * Escapes special regex characters in a string.
 * This is necessary when using user input in regex patterns to prevent
 * regex injection or syntax errors.
 */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Creates a case-insensitive regex pattern for searching.
 * Returns a pattern that matches the search term anywhere in the string.
 *
 * @param searchTerm - The search term to convert to a regex pattern
 * @returns A case-insensitive regex pattern string, or undefined if searchTerm is empty
 */
export const createCaseInsensitivePattern = (
  searchTerm: string
): string | undefined => {
  const trimmed = searchTerm.trim();
  if (!trimmed) {
    return undefined;
  }
  return `(?i).*${escapeRegex(trimmed)}.*`;
};
