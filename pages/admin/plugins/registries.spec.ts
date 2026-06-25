import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

describe('admin plugins registries page (alias)', () => {
  it('renders the canonical plugins registries page', async () => {
    const Page = (await import('./registries.vue')).default;
    const PluginsRegistriesPage = (
      await import('@/pages/admin/settings/plugins/registries.vue')
    ).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PluginsRegistriesPage).exists()).toBe(true);
  });
});
