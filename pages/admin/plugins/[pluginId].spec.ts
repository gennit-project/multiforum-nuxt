import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

describe('admin plugin detail page (alias)', () => {
  it('renders the canonical plugin detail page', async () => {
    const Page = (await import('./[pluginId].vue')).default;
    const PluginDetailPage = (
      await import('@/pages/admin/settings/plugins/[pluginId].vue')
    ).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PluginDetailPage).exists()).toBe(true);
  });
});
