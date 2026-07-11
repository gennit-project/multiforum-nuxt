import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginReadmeSection from './PluginReadmeSection.vue';

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<div class="form-row"><slot name="content" /></div>',
  },
  MarkdownRenderer: {
    name: 'MarkdownRenderer',
    props: ['text', 'fontSize'],
    template: '<div class="markdown">{{ text }}</div>',
  },
};

const mountSection = (props: {
  pluginReadme: string | null;
  pluginDetailLoading: boolean;
}) => mount(PluginReadmeSection, { props, global: { stubs } });

describe('PluginReadmeSection', () => {
  it('renders nothing when there is no readme and it is not loading', () => {
    const wrapper = mountSection({ pluginReadme: null, pluginDetailLoading: false });
    expect(wrapper.findComponent({ name: 'FormRow' }).exists()).toBe(false);
  });

  it('shows the loading state while the readme is loading', () => {
    const wrapper = mountSection({ pluginReadme: null, pluginDetailLoading: true });
    expect(wrapper.text()).toContain('Loading documentation');
  });

  it('renders the readme through the markdown renderer', () => {
    const wrapper = mountSection({
      pluginReadme: '# Docs',
      pluginDetailLoading: false,
    });
    expect(wrapper.findComponent({ name: 'MarkdownRenderer' }).props('text')).toBe(
      '# Docs'
    );
  });

  it('shows the readme (not the spinner) when a readme is present even while loading', () => {
    const wrapper = mountSection({
      pluginReadme: '# Docs',
      pluginDetailLoading: true,
    });
    expect(wrapper.text()).not.toContain('Loading documentation');
  });
});
