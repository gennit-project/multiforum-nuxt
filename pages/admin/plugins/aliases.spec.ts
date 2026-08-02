import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', vi.fn());

const aliases = [
  ['[pluginId].vue', () => import('./[pluginId].vue'), 'PluginDetailPage'],
  ['docs.vue', () => import('./docs.vue'), 'PluginsDocsPage'],
  ['index.vue', () => import('./index.vue'), 'PluginsIndexPage'],
  ['pipelines.vue', () => import('./pipelines.vue'), 'PluginsPipelinesPage'],
  ['registries.vue', () => import('./registries.vue'), 'PluginsRegistriesPage'],
] as const;

describe('legacy admin plugin route aliases', () => {
  it.each(aliases)(
    'renders the settings page for %s',
    async (_file, loadPage, childName) => {
      const Page = (await loadPage()).default;
      const wrapper = shallowMount(Page);

      expect(wrapper.findComponent({ name: childName }).exists()).toBe(true);
    }
  );
});
