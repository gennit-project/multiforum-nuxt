import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import DocsPage from './docs.vue';

// definePageMeta is a Nuxt compiler macro; stub it so the page mounts.
vi.stubGlobal('definePageMeta', vi.fn());

const stubs = {
  // FormRow exposes a #content slot; render it so the docs sections appear.
  FormRow: {
    name: 'FormRow',
    props: ['id', 'sectionTitle'],
    template: '<div class="form-row">{{ sectionTitle }}<slot name="content" /></div>',
  },
  MarkdownRenderer: {
    name: 'MarkdownRenderer',
    props: ['text'],
    template: '<div class="markdown">{{ text }}</div>',
  },
};

const mountDocs = () =>
  mountWithDefaults(DocsPage, { global: { stubs } });

describe('Plugin docs page', () => {
  it('renders the page title and subtitle', () => {
    const wrapper = mountDocs();
    expect(wrapper.get('h1').text()).toBe('Plugin Documentation');
    expect(wrapper.text()).toContain('set up registries');
  });

  it('renders the section headings via FormRow', () => {
    const wrapper = mountDocs();
    const rows = wrapper.findAllComponents({ name: 'FormRow' });
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.map((r) => r.props('sectionTitle'))).toContain('Overview');
  });

  it('passes documentation content into the markdown renderers', () => {
    const wrapper = mountDocs();
    const renderers = wrapper.findAllComponents({ name: 'MarkdownRenderer' });
    expect(renderers.length).toBeGreaterThan(1);
    // The overview section describes the plugin system.
    expect(wrapper.text()).toContain('plugin system');
  });
});
