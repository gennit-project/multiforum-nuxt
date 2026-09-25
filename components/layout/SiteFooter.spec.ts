import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SiteFooter from './SiteFooter.vue';
import { UPSTREAM_BRANDING } from '@/utils/branding';

// The real useBranding composable (and therefore the real resolver) runs in
// these tests; only its two inputs are mocked — the deployment's public runtime
// config and the admin-editable ServerConfig branding — so the footer is
// exercised the way a real deployment resolves them.
const mockPublicConfig: {
  branding?: Record<string, unknown>;
  brandingLocked?: boolean;
} = {};
const mockServerBranding: { value: Record<string, unknown> | null } = {
  value: null,
};

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({ public: mockPublicConfig }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: computed(() =>
      mockServerBranding.value
        ? { serverConfigs: [mockServerBranding.value] }
        : undefined
    ),
    loading: ref(false),
    error: ref(null),
    onResult: vi.fn(),
  }),
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
    delete mockPublicConfig.brandingLocked;
    mockServerBranding.value = null;
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

  it('lets admin-configured branding win over the deployment default', () => {
    mockPublicConfig.branding = { docsUrl: 'https://docs.from-env.test' };
    mockServerBranding.value = {
      brandingDocsURL: 'https://docs.from-admin.test',
    };

    expect(
      mountFooter().find('a[href="https://docs.from-admin.test"]').exists()
    ).toBe(true);
  });

  it('ignores unset admin branding fields', () => {
    mockPublicConfig.branding = { docsUrl: 'https://docs.from-env.test' };
    mockServerBranding.value = { brandingDocsURL: null };

    expect(
      mountFooter().find('a[href="https://docs.from-env.test"]').exists()
    ).toBe(true);
  });

  it('lets the deployment win over admin branding when branding is locked', () => {
    mockPublicConfig.brandingLocked = true;
    mockPublicConfig.branding = { docsUrl: 'https://docs.from-env.test' };
    mockServerBranding.value = {
      brandingDocsURL: 'https://docs.from-admin.test',
    };

    expect(
      mountFooter().find('a[href="https://docs.from-env.test"]').exists()
    ).toBe(true);
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
