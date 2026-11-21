/**
 * URL slug helpers for the "number + decorative slug" route scheme
 * (e.g. `/forums/cats/discussions/42-trail-conditions`).
 *
 * Mirrors the backend's `services/slugify.ts` so links built here match the
 * ones the backend puts in notification emails. The slug is purely cosmetic:
 * detail pages resolve against the leading canonical number and ignore the
 * slug text, so it never needs to be stored, unique or stable.
 */

const DEFAULT_MAX_LENGTH = 60;

/**
 * Turn an arbitrary title into a lowercase, hyphenated, ASCII slug. Strips
 * diacritics, collapses any run of non-alphanumerics to a single hyphen, trims
 * leading/trailing hyphens and caps the length without leaving a dangling
 * hyphen. Returns "" for empty/untitled input.
 */
export const slugify = (
  input: string | null | undefined,
  maxLength: number = DEFAULT_MAX_LENGTH
): string => {
  if (!input) return '';

  const normalized = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any non-alphanumeric run -> single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).replace(/-+$/g, '');
};

type BuildSlugSegmentParams = {
  id: number | string;
  title?: string | null;
  maxLength?: number;
};

/**
 * Build the decorative URL segment from a canonical id and an optional title:
 *   buildSlugSegment({ id: 42, title: 'Trail conditions' }) -> '42-trail-conditions'
 *   buildSlugSegment({ id: 42, title: '' })                 -> '42'
 * The number is always the canonical identifier; the slug is appended only
 * when the title yields one.
 */
export const buildSlugSegment = ({
  id,
  title,
  maxLength = DEFAULT_MAX_LENGTH,
}: BuildSlugSegmentParams): string => {
  const slug = slugify(title, maxLength);
  return slug ? `${id}-${slug}` : `${id}`;
};

/**
 * Parse the canonical leading integer out of a route segment, ignoring any
 * decorative slug suffix: parseSlugSegmentNumber('42-trail-conditions') -> 42.
 * Returns null when the segment does not start with an integer.
 */
export const parseSlugSegmentNumber = (
  segment: string | string[] | null | undefined
): number | null => {
  const value = Array.isArray(segment) ? segment[0] : segment;
  if (!value) return null;
  const match = /^(\d+)/.exec(value.trim());
  if (!match) return null;
  const parsed = Number.parseInt(match[1] ?? '', 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
};
