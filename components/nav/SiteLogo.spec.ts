import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import SiteLogo from '@/components/nav/SiteLogo.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mockServerBranding: { value: Record<string, unknown> | null } = {
  value: null,
};

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({ public: {} }),
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
  }),
}));

vi.mock('@/config', () => ({
  config: { serverName: 'test', serverDisplayName: 'Test Forum' },
}));

describe('SiteLogo', () => {
  beforeEach(() => {
    mockServerBranding.value = null;
  });

  it('shows the server display name when no logo is configured', () => {
    expect(mountWithDefaults(SiteLogo).text()).toContain('Test Forum');
  });

  it('renders the configured light-mode logo', () => {
    mockServerBranding.value = {
      serverIconURL: 'https://cdn.example.test/logo.svg',
      brandingLogoAlt: 'Acme Forum',
    };

    expect(mountWithDefaults(SiteLogo).get('img').attributes('src')).toBe(
      'https://cdn.example.test/logo.svg'
    );
  });

  it('uses the configured accessible name', () => {
    mockServerBranding.value = {
      serverIconURL: '/logo.svg',
      brandingLogoAlt: 'Acme Forum',
    };

    expect(mountWithDefaults(SiteLogo).get('img').attributes('alt')).toBe(
      'Acme Forum'
    );
  });

  it('falls back to the server display name when an old logo lacks alt text', () => {
    mockServerBranding.value = { serverIconURL: '/logo.svg' };

    expect(mountWithDefaults(SiteLogo).get('img').attributes('alt')).toBe(
      'Test Forum'
    );
  });

  it('renders a separate dark-mode logo when configured', () => {
    mockServerBranding.value = {
      serverIconURL: '/logo.svg',
      brandingLogoDarkURL: '/logo-dark.svg',
      brandingLogoAlt: 'Acme Forum',
    };

    expect(
      mountWithDefaults(SiteLogo)
        .findAll('img')
        .map((image) => image.attributes('src'))
    ).toEqual(['/logo.svg', '/logo-dark.svg']);
  });
});
