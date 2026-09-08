import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteFooter from './SiteFooter.vue';
import { UPSTREAM_BRANDING } from '@/utils/branding';

// The real useBranding composable (and therefore the real resolver) runs in
// these tests; only its input — the deployment's public runtime config — is
// mocked, so the footer is exercised the way a deployment configures it.
const mockPublicConfig: { branding?: Record<string, unknown> } = {};

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({ public: mockPublicConfig }),
}));

describe('SiteFooter', () => {
  const mountFooter = () =>
    mount(SiteFooter, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

  beforeEach(() => {
    delete mockPublicConfig.branding;
  });

  it('links to the harmful or illegal content report form', () => {
    const wrapper = mountFooter();

    expect(wrapper.get('a[href="/support?type=content-report"]').text()).toBe(
      'Report Harmful or Illegal Content'
    );
  });

  it('links to the public server moderation issue list', () => {
    const wrapper = mountFooter();

    expect(wrapper.get('a[href="/server/issues"]').text()).toBe(
      'Moderation Issues'
    );
  });

  it('links to the upstream documentation by default', () => {
    const wrapper = mountFooter();

    expect(
      wrapper.get(`a[href="${UPSTREAM_BRANDING.docsUrl}"]`).text()
    ).toContain('Documentation');
  });

  it('links to the upstream source repository by default', () => {
    const wrapper = mountFooter();

    expect(
      wrapper.get(`a[href="${UPSTREAM_BRANDING.sourceUrl}"]`).text()
    ).toContain('Source code');
  });

  it('names the upstream product in the attribution row by default', () => {
    expect(mountFooter().text()).toContain('Powered by Multiforum');
  });

  it('omits a support address when the deployment configures none', () => {
    expect(mountFooter().find('a[href^="mailto:"]').exists()).toBe(false);
  });

  it('emails the configured support address', () => {
    mockPublicConfig.branding = { supportEmail: 'help@acme.test' };

    expect(mountFooter().get('a[href="mailto:help@acme.test"]').text()).toBe(
      'help@acme.test'
    );
  });

  it('omits the support row when no support contact is configured', () => {
    mockPublicConfig.branding = {
      supportEmail: '',
      showUpstreamLinks: false,
      docsUrl: '',
      sourceUrl: '',
    };

    expect(mountFooter().text()).not.toContain('technical problems');
  });

  it('points documentation at the configured docs site', () => {
    mockPublicConfig.branding = { docsUrl: 'https://docs.acme.test' };

    expect(
      mountFooter().get('a[href="https://docs.acme.test"]').text()
    ).toContain('Documentation');
  });

  it('renames the product for a private-labeled instance', () => {
    mockPublicConfig.branding = { productName: 'Acme Forum' };

    expect(mountFooter().text()).toContain('Powered by Acme Forum');
  });

  it('hides the attribution row when upstream links are disabled', () => {
    mockPublicConfig.branding = { showUpstreamLinks: false };

    expect(mountFooter().text()).not.toContain('Powered by');
  });

  it('hides the upstream issue tracker when upstream links are disabled', () => {
    mockPublicConfig.branding = { showUpstreamLinks: false };

    expect(mountFooter().find('a[href*="github.com"]').exists()).toBe(false);
  });

  it('still offers the support email when upstream links are disabled', () => {
    mockPublicConfig.branding = {
      showUpstreamLinks: false,
      supportEmail: 'help@acme.test',
    };

    expect(mountFooter().find('a[href="mailto:help@acme.test"]').exists()).toBe(
      true
    );
  });

  it('renders operator-configured footer links', () => {
    mockPublicConfig.branding = {
      customFooterLinks: '[{"label":"Community Handbook","url":"/handbook"}]',
    };

    expect(mountFooter().get('a[href="/handbook"]').text()).toContain(
      'Community Handbook'
    );
  });

  it('drops an operator link with an unsafe URL', () => {
    mockPublicConfig.branding = {
      customFooterLinks: [{ label: 'Bad', url: 'javascript:alert(1)' }],
    };

    expect(mountFooter().text()).not.toContain('Bad');
  });

  it('warns screen reader users when an operator link opens a new tab', () => {
    mockPublicConfig.branding = {
      customFooterLinks: [{ label: 'Handbook', url: 'https://acme.test' }],
    };

    expect(mountFooter().get('a[href="https://acme.test"]').text()).toContain(
      'opens in a new tab'
    );
  });
});
