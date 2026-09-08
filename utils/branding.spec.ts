import { describe, expect, it } from 'vitest';
import {
  MAX_CUSTOM_FOOTER_LINKS,
  UPSTREAM_BRANDING,
  isSafeBrandingUrl,
  parseBrandingFlag,
  parseBrandingLinks,
  readBrandingEnv,
  resolveBranding,
} from './branding';

describe('isSafeBrandingUrl', () => {
  it.each([
    ['https://docs.example.com', true],
    ['http://docs.example.com', true],
    ['/support', true],
    ['//evil.example.com', false],
    ['javascript:alert(1)', false],
    ['data:text/html,<script>alert(1)</script>', false],
    ['mailto:support@example.com', false],
    ['not a url', false],
  ])('treats %s as safe=%s', (value, expected) => {
    expect(isSafeBrandingUrl(value)).toBe(expected);
  });
});

describe('parseBrandingFlag', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['FALSE', false],
    ['yes', undefined],
    [undefined, undefined],
  ])('parses %s as %s', (value, expected) => {
    expect(parseBrandingFlag(value)).toBe(expected);
  });
});

describe('parseBrandingLinks', () => {
  it('parses a JSON string into links', () => {
    expect(
      parseBrandingLinks('[{"label":"Handbook","url":"https://example.com"}]')
    ).toEqual([{ label: 'Handbook', url: 'https://example.com' }]);
  });

  it('drops entries whose URL is unsafe but keeps the rest', () => {
    expect(
      parseBrandingLinks([
        { label: 'Bad', url: 'javascript:alert(1)' },
        { label: 'Good', url: '/handbook' },
      ])
    ).toEqual([{ label: 'Good', url: '/handbook' }]);
  });

  it('drops entries with no label', () => {
    expect(parseBrandingLinks([{ label: '  ', url: '/handbook' }])).toEqual([]);
  });

  it('caps the number of links', () => {
    const many = Array.from(
      { length: MAX_CUSTOM_FOOTER_LINKS + 3 },
      (_, i) => ({
        label: `Link ${i}`,
        url: `/link-${i}`,
      })
    );

    expect(parseBrandingLinks(many)).toHaveLength(MAX_CUSTOM_FOOTER_LINKS);
  });

  it('returns undefined for malformed JSON so the layer below wins', () => {
    expect(parseBrandingLinks('{not json')).toBeUndefined();
  });

  it('treats an empty string as an explicit empty list', () => {
    expect(parseBrandingLinks('')).toEqual([]);
  });
});

describe('resolveBranding', () => {
  it('returns upstream defaults when no layer is configured', () => {
    expect(resolveBranding()).toEqual(UPSTREAM_BRANDING);
  });

  it('ignores null layers', () => {
    expect(resolveBranding({ layers: [null, undefined] })).toEqual(
      UPSTREAM_BRANDING
    );
  });

  it('applies a configured docs URL over the upstream default', () => {
    expect(
      resolveBranding({ layers: [{ docsUrl: 'https://docs.acme.test' }] })
        .docsUrl
    ).toBe('https://docs.acme.test');
  });

  it('lets a later layer win over an earlier one', () => {
    expect(
      resolveBranding({
        layers: [
          { productName: 'From env' },
          { productName: 'From server config' },
        ],
      }).productName
    ).toBe('From server config');
  });

  it('treats an empty docs URL as an explicit opt-out', () => {
    expect(resolveBranding({ layers: [{ docsUrl: '' }] }).docsUrl).toBe('');
  });

  it('falls back to the layer below when a URL is unsafe', () => {
    expect(
      resolveBranding({ layers: [{ sourceUrl: 'javascript:alert(1)' }] })
        .sourceUrl
    ).toBe(UPSTREAM_BRANDING.sourceUrl);
  });

  it('keeps the product name when a layer supplies only whitespace', () => {
    expect(
      resolveBranding({ layers: [{ productName: '   ' }] }).productName
    ).toBe(UPSTREAM_BRANDING.productName);
  });

  it('applies a configured support email', () => {
    expect(
      resolveBranding({ layers: [{ supportEmail: 'help@acme.test' }] })
        .supportEmail
    ).toBe('help@acme.test');
  });

  it('treats an empty support email as an explicit opt-out', () => {
    expect(
      resolveBranding({ layers: [{ supportEmail: '' }] }).supportEmail
    ).toBe('');
  });

  it('falls back to the layer below when a support email is malformed', () => {
    expect(
      resolveBranding({
        layers: [{ supportEmail: 'help@acme.test' }, { supportEmail: 'nope' }],
      }).supportEmail
    ).toBe('help@acme.test');
  });

  it('leaves the support email unset when nothing configures one', () => {
    expect(resolveBranding().supportEmail).toBe('');
  });

  it('honors a string false for showUpstreamLinks', () => {
    expect(
      resolveBranding({ layers: [{ showUpstreamLinks: 'false' }] })
        .showUpstreamLinks
    ).toBe(false);
  });
});

describe('readBrandingEnv', () => {
  it('falls back to upstream defaults when nothing is set', () => {
    expect(readBrandingEnv({}).docsUrl).toBe(UPSTREAM_BRANDING.docsUrl);
  });

  it('reads the support email from the environment', () => {
    expect(
      readBrandingEnv({ VITE_BRANDING_SUPPORT_EMAIL: 'help@acme.test' })
        .supportEmail
    ).toBe('help@acme.test');
  });

  it('reads the upstream-links flag from the environment', () => {
    expect(
      readBrandingEnv({ VITE_BRANDING_SHOW_UPSTREAM_LINKS: 'false' })
        .showUpstreamLinks
    ).toBe(false);
  });

  it('passes custom footer links through as a JSON string', () => {
    expect(
      readBrandingEnv({
        VITE_BRANDING_CUSTOM_FOOTER_LINKS: '[{"label":"a","url":"/a"}]',
      }).customFooterLinks
    ).toBe('[{"label":"a","url":"/a"}]');
  });

  it('tolerates a missing environment object', () => {
    expect(readBrandingEnv(undefined).productName).toBe(
      UPSTREAM_BRANDING.productName
    );
  });
});
