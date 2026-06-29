import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PluginsIndexPage from './index.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
  }),
}));

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<section><slot name="content" /></section>',
  },
  PluginDiscoverySection: {
    name: 'PluginDiscoverySection',
    template: '<div />',
  },
};

describe('Plugins settings page', () => {
  it('renders the management shell', () => {
    const wrapper = mountWithDefaults(PluginsIndexPage, { global: { stubs } });

    expect(wrapper.text()).toContain('Manage plugins available on your server.');
    expect(wrapper.text()).toContain('No plugins available yet');
  });
});
