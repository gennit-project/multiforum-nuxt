import removeMarkdown from 'remove-markdown';

export function getPlainWikiTitle(
  title: string | null | undefined,
  fallback = ''
): string {
  if (!title) return fallback;
  return removeMarkdown(title).trim() || fallback;
}
