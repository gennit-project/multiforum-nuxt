/**
 * Instance branding.
 *
 * Branding resolves through ordered layers, lowest precedence first, so the
 * same resolver serves every deployment shape:
 *
 *   upstream defaults  ->  NUXT_PUBLIC_BRANDING_* env  ->  ServerConfig
 *
 * Value semantics, applied per field:
 * - an explicit empty string DISABLES an optional field (matching the existing
 *   runtime-config contract, where clearing a value opts out of its fallback)
 * - a malformed value falls back to the layer below, so a typo or a hostile
 *   `javascript:` URL can never reach an anchor tag
 */

export type BrandingLink = {
  label: string;
  url: string;
};

export type BrandingValues = {
  /** Light-mode logo displayed in the home link. Empty keeps the text logo. */
  logoUrl: string;
  /** Dark-mode logo. Empty falls back to logoUrl. */
  logoDarkUrl: string;
  /** Accessible name for the logo image. */
  logoAlt: string;
  /** Browser favicon. Empty keeps the application default. */
  faviconUrl: string;
  /** Hex colour used to derive the brand palette. Empty keeps orange. */
  primaryColor: string;
  /** Private-label name shown in footer attribution. Never empty. */
  productName: string;
  /** Documentation site. Empty hides the docs link. */
  docsUrl: string;
  /** Source repository. Empty hides the source link. */
  sourceUrl: string;
  /** Upstream bug tracker for the software itself. Empty hides the link. */
  issuesUrl: string;
  /** Contact address for instance support. Empty hides the email. */
  supportEmail: string;
  /** Rancher's `ui-community-links` analog: hide all upstream references. */
  showUpstreamLinks: boolean;
  /** Operator-added footer links, appended after the built-in ones. */
  customFooterLinks: BrandingLink[];
};

/** A partial, unvalidated branding layer (env vars, later ServerConfig). */
export type BrandingLayer = Partial<Record<keyof BrandingValues, unknown>>;

/** Upstream defaults. These preserve the previously hardcoded footer values. */
export const UPSTREAM_BRANDING: BrandingValues = {
  logoUrl: '',
  logoDarkUrl: '',
  logoAlt: '',
  faviconUrl: '',
  primaryColor: '',
  productName: 'Multiforum',
  docsUrl: 'https://docs.multiforum.net/',
  sourceUrl: 'https://github.com/gennit-project/multiforum-nuxt',
  issuesUrl: 'https://github.com/gennit-project/multiforum-nuxt/issues',
  // Deliberately empty: an unconfigured self-hosted instance must not route its
  // users' support mail to the upstream maintainers. Deployments that want a
  // support address set NUXT_PUBLIC_BRANDING_SUPPORT_EMAIL (or the VITE_
  // equivalent); until then the footer simply omits the address.
  supportEmail: '',
  showUpstreamLinks: true,
  customFooterLinks: [],
};

/** Footer links stay scannable; anything past this is dropped. */
export const MAX_CUSTOM_FOOTER_LINKS = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

export const BRAND_LIGHT_SURFACE = '#ffffff';
export const BRAND_DARK_SURFACE = '#0d1117';

const asTrimmedString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

/**
 * Accepts absolute http(s) URLs and site-relative paths only. Protocol-relative
 * `//evil.example` is rejected because it reads as a path but is not one.
 */
export const isSafeBrandingUrl = (value: string): boolean => {
  if (value.startsWith('//')) {
    return false;
  }
  if (value.startsWith('/')) {
    return true;
  }
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidHexColor = (value: string): boolean =>
  HEX_COLOR_PATTERN.test(value);

type RgbColor = { red: number; green: number; blue: number };

const hexToRgb = (value: string): RgbColor | null => {
  if (!isValidHexColor(value)) return null;
  return {
    red: Number.parseInt(value.slice(1, 3), 16),
    green: Number.parseInt(value.slice(3, 5), 16),
    blue: Number.parseInt(value.slice(5, 7), 16),
  };
};

const rgbToHex = ({ red, green, blue }: RgbColor): string =>
  `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;

const mixColors = (
  foreground: RgbColor,
  background: RgbColor,
  amount: number
) =>
  rgbToHex({
    red: foreground.red * amount + background.red * (1 - amount),
    green: foreground.green * amount + background.green * (1 - amount),
    blue: foreground.blue * amount + background.blue * (1 - amount),
  });

const WHITE: RgbColor = { red: 255, green: 255, blue: 255 };
const BLACK: RgbColor = { red: 0, green: 0, blue: 0 };

/** Derive a complete Tailwind scale while keeping the configured colour at 500. */
export const createBrandPalette = (
  primaryColor: string
): Record<string, string> | null => {
  const primary = hexToRgb(primaryColor);
  if (!primary) return null;

  return {
    50: mixColors(primary, WHITE, 0.08),
    100: mixColors(primary, WHITE, 0.16),
    200: mixColors(primary, WHITE, 0.3),
    300: mixColors(primary, WHITE, 0.5),
    400: mixColors(primary, WHITE, 0.75),
    500: primaryColor.toLowerCase(),
    600: mixColors(primary, BLACK, 0.88),
    700: mixColors(primary, BLACK, 0.74),
    800: mixColors(primary, BLACK, 0.6),
    900: mixColors(primary, BLACK, 0.46),
    950: mixColors(primary, BLACK, 0.32),
  };
};

export const createBrandPaletteCss = (primaryColor: string): string => {
  const palette = createBrandPalette(primaryColor);
  if (!palette) return '';
  const declarations = Object.entries(palette)
    .map(([stop, value]) => `--color-brand-${stop}:${value}`)
    .join(';');
  return `:root{${declarations}}`;
};

const relativeLuminance = ({ red, green, blue }: RgbColor): number => {
  const linearize = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)
  );
};

export const getContrastRatio = (
  foreground: string,
  background: string
): number | null => {
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  if (!foregroundRgb || !backgroundRgb) return null;
  const foregroundLuminance = relativeLuminance(foregroundRgb);
  const backgroundLuminance = relativeLuminance(backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

export const parseBrandingFlag = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = asTrimmedString(value)?.toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return undefined;
};

/**
 * Custom links arrive either as an array (a future ServerConfig JSON column) or
 * as a JSON string (an environment variable). Entries missing a label or
 * carrying an unsafe URL are dropped individually rather than voiding the list.
 */
export const parseBrandingLinks = (
  value: unknown
): BrandingLink[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  let raw = value;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) {
      return [];
    }
    try {
      raw = JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  if (!Array.isArray(raw)) {
    return undefined;
  }

  return raw
    .flatMap((entry): BrandingLink[] => {
      if (!entry || typeof entry !== 'object') {
        return [];
      }
      const label = asTrimmedString((entry as BrandingLink).label);
      const url = asTrimmedString((entry as BrandingLink).url);
      if (!label || !url || !isSafeBrandingUrl(url)) {
        return [];
      }
      return [{ label, url }];
    })
    .slice(0, MAX_CUSTOM_FOOTER_LINKS);
};

const applyRequiredText = (current: string, value: unknown): string => {
  const text = asTrimmedString(value);
  return text ? text : current;
};

const applyOptionalUrl = (current: string, value: unknown): string => {
  const text = asTrimmedString(value);
  if (text === undefined) return current;
  if (text === '') return '';
  return isSafeBrandingUrl(text) ? text : current;
};

const applyOptionalEmail = (current: string, value: unknown): string => {
  const text = asTrimmedString(value);
  if (text === undefined) return current;
  if (text === '') return '';
  return EMAIL_PATTERN.test(text) ? text : current;
};

const applyOptionalColor = (current: string, value: unknown): string => {
  const text = asTrimmedString(value);
  if (text === undefined) return current;
  if (text === '') return '';
  return isValidHexColor(text) ? text.toLowerCase() : current;
};

const applyOptionalText = (current: string, value: unknown): string => {
  const text = asTrimmedString(value);
  return text === undefined ? current : text;
};

/**
 * Merge branding layers in ascending precedence order and return a fully
 * populated, sanitized value object.
 */
export const resolveBranding = ({
  layers = [],
  defaults = UPSTREAM_BRANDING,
}: {
  layers?: (BrandingLayer | null | undefined)[];
  defaults?: BrandingValues;
} = {}): BrandingValues =>
  layers.reduce<BrandingValues>((resolved, layer) => {
    if (!layer) {
      return resolved;
    }

    const flag = parseBrandingFlag(layer.showUpstreamLinks);
    const links = parseBrandingLinks(layer.customFooterLinks);

    return {
      logoUrl: applyOptionalUrl(resolved.logoUrl, layer.logoUrl),
      logoDarkUrl: applyOptionalUrl(resolved.logoDarkUrl, layer.logoDarkUrl),
      logoAlt: applyOptionalText(resolved.logoAlt, layer.logoAlt),
      faviconUrl: applyOptionalUrl(resolved.faviconUrl, layer.faviconUrl),
      primaryColor: applyOptionalColor(
        resolved.primaryColor,
        layer.primaryColor
      ),
      productName: applyRequiredText(resolved.productName, layer.productName),
      docsUrl: applyOptionalUrl(resolved.docsUrl, layer.docsUrl),
      sourceUrl: applyOptionalUrl(resolved.sourceUrl, layer.sourceUrl),
      issuesUrl: applyOptionalUrl(resolved.issuesUrl, layer.issuesUrl),
      supportEmail: applyOptionalEmail(
        resolved.supportEmail,
        layer.supportEmail
      ),
      showUpstreamLinks: flag ?? resolved.showUpstreamLinks,
      customFooterLinks: links ?? resolved.customFooterLinks,
    };
  }, defaults);

/**
 * Build-time branding defaults read from VITE_* variables, mirroring how
 * `config.ts` sources the rest of the instance configuration. The values are
 * placed in `runtimeConfig.public.branding`, where Nuxt lets each one be
 * overridden at container startup by its NUXT_PUBLIC_BRANDING_* counterpart.
 */
export const readBrandingEnv = (
  env: Record<string, unknown> | undefined
): Required<Record<keyof BrandingValues, string | boolean>> => {
  const text = (key: string, fallback: string): string => {
    const value = env?.[key];
    return typeof value === 'string' ? value : fallback;
  };

  return {
    logoUrl: text('VITE_BRANDING_LOGO_URL', UPSTREAM_BRANDING.logoUrl),
    logoDarkUrl: text(
      'VITE_BRANDING_LOGO_DARK_URL',
      UPSTREAM_BRANDING.logoDarkUrl
    ),
    logoAlt: text('VITE_BRANDING_LOGO_ALT', UPSTREAM_BRANDING.logoAlt),
    faviconUrl: text('VITE_BRANDING_FAVICON_URL', UPSTREAM_BRANDING.faviconUrl),
    primaryColor: text(
      'VITE_BRANDING_PRIMARY_COLOR',
      UPSTREAM_BRANDING.primaryColor
    ),
    productName: text(
      'VITE_BRANDING_PRODUCT_NAME',
      UPSTREAM_BRANDING.productName
    ),
    docsUrl: text('VITE_BRANDING_DOCS_URL', UPSTREAM_BRANDING.docsUrl),
    sourceUrl: text('VITE_BRANDING_SOURCE_URL', UPSTREAM_BRANDING.sourceUrl),
    issuesUrl: text('VITE_BRANDING_ISSUES_URL', UPSTREAM_BRANDING.issuesUrl),
    supportEmail: text(
      'VITE_BRANDING_SUPPORT_EMAIL',
      UPSTREAM_BRANDING.supportEmail
    ),
    showUpstreamLinks:
      parseBrandingFlag(env?.VITE_BRANDING_SHOW_UPSTREAM_LINKS) ??
      UPSTREAM_BRANDING.showUpstreamLinks,
    // Kept as a JSON string so a single NUXT_PUBLIC_BRANDING_CUSTOM_FOOTER_LINKS
    // environment variable can override it; resolveBranding parses it.
    customFooterLinks: text('VITE_BRANDING_CUSTOM_FOOTER_LINKS', ''),
  };
};

/**
 * Whether branding is pinned by deployment config rather than editable in the
 * admin UI. Operators who manage a deployment declaratively set this so a
 * database value cannot drift from the checked-in configuration.
 */
export const readBrandingLocked = (
  env: Record<string, unknown> | undefined
): boolean => parseBrandingFlag(env?.VITE_BRANDING_LOCKED) ?? false;
