import { describe, expect, it } from 'vitest';
import { toBrandingLayer } from './useBranding';
import { resolveBranding, UPSTREAM_BRANDING } from '@/utils/branding';

describe('toBrandingLayer', () => {
  it('returns an empty layer when no server config is loaded', () => {
    expect(toBrandingLayer(null)).toEqual({});
  });

  it('maps the API field names onto the resolver field names', () => {
    expect(
      toBrandingLayer({
        brandingProductName: 'Acme Forum',
        brandingDocsURL: 'https://docs.acme.test',
        brandingSourceURL: 'https://github.com/acme/forum',
        brandingIssuesURL: 'https://github.com/acme/forum/issues',
        brandingSupportEmail: 'help@acme.test',
        brandingShowUpstreamLinks: false,
        brandingCustomFooterLinks: [{ label: 'Handbook', url: '/handbook' }],
      })
    ).toEqual({
      productName: 'Acme Forum',
      docsUrl: 'https://docs.acme.test',
      sourceUrl: 'https://github.com/acme/forum',
      issuesUrl: 'https://github.com/acme/forum/issues',
      supportEmail: 'help@acme.test',
      showUpstreamLinks: false,
      customFooterLinks: [{ label: 'Handbook', url: '/handbook' }],
    });
  });

  it('omits unset columns so the layer below keeps its value', () => {
    expect(
      toBrandingLayer({
        brandingProductName: null,
        brandingDocsURL: undefined,
      })
    ).toEqual({});
  });

  it('keeps an empty string, which is a deliberate opt-out', () => {
    expect(toBrandingLayer({ brandingDocsURL: '' })).toEqual({ docsUrl: '' });
  });

  it('leaves the deployment value in place for an unset column', () => {
    const resolved = resolveBranding({
      layers: [
        { docsUrl: 'https://docs.from-env.test' },
        toBrandingLayer({ brandingDocsURL: null }),
      ],
    });

    expect(resolved.docsUrl).toBe('https://docs.from-env.test');
  });

  it('lets an admin opt out of a link the deployment configured', () => {
    const resolved = resolveBranding({
      layers: [
        { docsUrl: 'https://docs.from-env.test' },
        toBrandingLayer({ brandingDocsURL: '' }),
      ],
    });

    expect(resolved.docsUrl).toBe('');
  });

  it('falls back to the upstream default when the admin value is unsafe', () => {
    const resolved = resolveBranding({
      layers: [toBrandingLayer({ brandingSourceURL: 'javascript:alert(1)' })],
    });

    expect(resolved.sourceUrl).toBe(UPSTREAM_BRANDING.sourceUrl);
  });
});
