import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

describe('admin plugins docs page (alias)', () => {
  it('renders the canonical plugins docs page', async () => {
    const Page = (await import('./docs.vue')).default;
    const PluginsDocsPage = (
      await import('@/pages/admin/settings/plugins/docs.vue')
    ).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PluginsDocsPage).exists()).toBe(true);
  });
});
