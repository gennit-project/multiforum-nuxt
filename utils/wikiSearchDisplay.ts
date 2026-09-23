/**
 * Display helpers for the site-wide wiki search results. Extracted from the
 * page so the word-count formatting can be unit-tested without mounting it.
 */

/**
 * Human-readable word count for a wiki page body: "0 words" for empty,
 * singular "1 word", and a compact "1.2k words" form once the count reaches
 * 1000 (trailing ".0" trimmed, e.g. "2k words").
 */
export function formatWordCount(body: string | null | undefined): string {
  if (!body) return '0 words';
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return '0 words';
  if (words >= 1000) {
    return `${(words / 1000).toFixed(1).replace(/\.0$/, '')}k words`;
  }
  return `${words} ${words === 1 ? 'word' : 'words'}`;
}

/**
 * Convert the beginning of a Markdown wiki body into a compact plain-text
 * preview suitable for a search-result card.
 */
export function formatWikiExcerpt(
  body: string | null | undefined,
  maxLength = 150
): string {
  if (!body) return '';

  const plainText = body
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*[-+>*]\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) return plainText;

  const shortened = plainText.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;

  return `${shortened.slice(0, cutoff).trimEnd()}…`;
}
