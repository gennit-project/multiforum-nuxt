/**
 * Instance branding (Phase 0: links and text only).
 *
 * Branding resolves through ordered layers, lowest precedence first, so the
 * same resolver serves every deployment shape:
 *
 *   upstream defaults  ->  NUXT_PUBLIC_BRANDING_* env  ->  (later) ServerConfig
 *
 * Phase 0 ships the first two layers. The admin-editable ServerConfig layer is
 * an additional entry in `layers`, so adding it later needs no rework here; an
 * operator who wants branding pinned by deployment config rather than editable
 * in the admin UI reverses the last two entries instead of gaining a new code
 * path.
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
