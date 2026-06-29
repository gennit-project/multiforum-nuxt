import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginDetailHeader from '@/components/admin/plugins/PluginDetailHeader.vue';

const mountHeader = (props: Record<string, unknown> = {}) =>
  mount(PluginDetailHeader, {
    props: { pluginDisplayName: 'My Plugin', pluginTags: [], ...props },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('PluginDetailHeader', () => {
  it('shows the plugin name', () => {
    const wrapper = mountHeader();

    expect(wrapper.text()).toContain('My Plugin');
  });

  it('shows the installed version badge', () => {
    const wrapper = mountHeader({ installedVersion: '2.0.1' });

    expect(wrapper.text()).toContain('v2.0.1');
  });

  it('links the author when a url is given', () => {
    const wrapper = mountHeader({ pluginAuthorName: 'Acme', pluginAuthorUrl: 'https://acme.dev' });

    expect(wrapper.find('a[href="https://acme.dev"]').text()).toContain('Acme');
  });

  it('shows a plain author name without a url', () => {
    const wrapper = mountHeader({ pluginAuthorName: 'Acme' });

    expect(wrapper.text()).toContain('Acme');
  });

  it('shows the license', () => {
    const wrapper = mountHeader({ pluginLicense: 'MIT' });

    expect(wrapper.text()).toContain('MIT');
  });

  it('shows the description', () => {
    const wrapper = mountHeader({ pluginDescription: 'Does things' });

    expect(wrapper.text()).toContain('Does things');
  });

  it('shows homepage and source links', () => {
    const wrapper = mountHeader({
      pluginHomepage: 'https://x/home',
      pluginRepoUrl: 'https://x/repo',
    });

    expect(wrapper.find('a[href="https://x/repo"]').exists()).toBe(true);
  });

  it('shows release and registry metadata', () => {
    const wrapper = mountHeader({
      pluginReleaseNotesUrl: 'https://x/releases/v1',
      pluginRegistryUrl: 'https://x/registry.json',
      pluginSourceCommit: '1234567890abcdef',
      pluginApiVersion: '1',
      pluginMinServerVersion: '0.8.0',
    });

    expect(wrapper.find('a[href="https://x/releases/v1"]').text()).toContain(
      'Release Notes'
    );
    expect(wrapper.find('a[href="https://x/registry.json"]').text()).toContain(
      'Registry'
    );
    expect(wrapper.text()).toContain('1234567890ab');
    expect(wrapper.text()).toContain('API 1');
    expect(wrapper.text()).toContain('Server >= 0.8.0');
  });

  it('renders the tags', () => {
    const wrapper = mountHeader({ pluginTags: ['ai', 'moderation'] });

    expect(wrapper.text()).toContain('moderation');
  });
});
