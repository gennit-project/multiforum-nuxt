export const IMAGE_VARIANT_KEYS = [
  'avatar32',
  'avatar48',
  'avatar64',
  'avatar96',
  'list80',
  'list160',
  'list320',
  'detail640',
  'detail960',
  'detail1280',
] as const;

export type ImageVariantKey = (typeof IMAGE_VARIANT_KEYS)[number];

export type ImageVariantUrls = Partial<Record<ImageVariantKey, string>>;

type VariantArrayEntry = {
  key?: string | null;
  name?: string | null;
  url?: string | null;
};

type VariantSourceRecord = Record<string, unknown>;

const DIRECT_VARIANT_FIELD_ALIASES: Record<ImageVariantKey, string[]> = {
  avatar32: ['avatar32Url', 'icon32Url'],
  avatar48: ['avatar48Url', 'icon48Url'],
  avatar64: ['avatar64Url', 'icon64Url'],
  avatar96: ['avatar96Url', 'icon96Url'],
  list80: ['list80Url', 'thumbnailUrl'],
  list160: ['list160Url'],
  list320: ['list320Url', 'cardImageUrl'],
  detail640: ['detail640Url', 'mediumImageUrl'],
  detail960: ['detail960Url'],
  detail1280: ['detail1280Url', 'largeImageUrl'],
};

const VARIANT_RECORD_FIELDS = ['variantUrls', 'imageVariantUrls'] as const;
const VARIANT_ARRAY_FIELDS = ['variants', 'imageVariants'] as const;
const ORIGINAL_URL_FIELDS = [
  'url',
  'profilePicURL',
  'channelIconURL',
  'coverImageURL',
] as const;

const isRecord = (value: unknown): value is VariantSourceRecord =>
  typeof value === 'object' && value !== null;

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

export function extractImageVariantUrls(source: unknown): ImageVariantUrls {
  if (!isRecord(source)) {
    return {};
  }

  const urls: ImageVariantUrls = {};

  for (const field of VARIANT_RECORD_FIELDS) {
    const value = source[field];
    if (!isRecord(value)) continue;
    for (const key of IMAGE_VARIANT_KEYS) {
      const candidate = asNonEmptyString(value[key]);
      if (candidate) {
        urls[key] = candidate;
      }
    }
  }

  for (const field of VARIANT_ARRAY_FIELDS) {
    const value = source[field];
    if (!Array.isArray(value)) continue;
    for (const entry of value) {
      if (!isRecord(entry)) continue;
      const variant = entry as VariantArrayEntry;
      const key = variant.key || variant.name;
      if (!key || !IMAGE_VARIANT_KEYS.includes(key as ImageVariantKey)) {
        continue;
      }
      const url = asNonEmptyString(variant.url);
      if (url) {
        urls[key as ImageVariantKey] = url;
      }
    }
  }

  for (const key of IMAGE_VARIANT_KEYS) {
    for (const alias of DIRECT_VARIANT_FIELD_ALIASES[key]) {
      const candidate = asNonEmptyString(source[alias]);
      if (candidate) {
        urls[key] = candidate;
        break;
      }
    }
  }

  return urls;
}

export function getOriginalImageUrl(source: unknown): string | null {
  if (typeof source === 'string') {
    return asNonEmptyString(source);
  }

  if (!isRecord(source)) {
    return null;
  }

  for (const field of ORIGINAL_URL_FIELDS) {
    const candidate = asNonEmptyString(source[field]);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function getPreferredImageUrl(input: {
  source?: unknown;
  preferred: ImageVariantKey[];
  originalUrl?: string | null;
}): string | null {
  const { source, preferred, originalUrl } = input;
  const variantUrls = extractImageVariantUrls(source);

  for (const key of preferred) {
    const candidate = variantUrls[key];
    if (candidate) {
      return candidate;
    }
  }

  return asNonEmptyString(originalUrl) || getOriginalImageUrl(source);
}
