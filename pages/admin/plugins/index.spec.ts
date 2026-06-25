import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

describe('admin plugins index page (alias)', () => {
  it('renders the canonical plugins settings page', async () => {
    const Page = (await import('./index.vue')).default;
    const PluginsIndexPage = (
      await import('@/pages/admin/settings/plugins/index.vue')
    ).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PluginsIndexPage).exists()).toBe(true);
  });
});
