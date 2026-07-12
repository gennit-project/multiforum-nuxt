import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginManifestSection from './PluginManifestSection.vue';

const stubs = {
  FormRow: {
    name: 'FormRow',
    props: ['sectionTitle'],
    template: '<div class="form-row"><slot name="content" /></div>',
  },
};

const mountSection = (props: { manifestJson: string | null }) =>
  mount(PluginManifestSection, {
    props,
    global: { stubs },
  });

describe('PluginManifestSection', () => {
  it('renders nothing when the manifest is missing', () => {
    const wrapper = mountSection({ manifestJson: null });

    expect(wrapper.findComponent({ name: 'FormRow' }).exists()).toBe(false);
  });

  it('renders the manifest inside a FormRow when present', () => {
    const wrapper = mountSection({ manifestJson: '{\"name\":\"plugin\"}' });

    expect(wrapper.findComponent({ name: 'FormRow' }).exists()).toBe(true);
    expect(wrapper.text()).toContain('{"name":"plugin"}');
  });

  it('renders the manifest region with the expected accessible label', () => {
    const wrapper = mountSection({ manifestJson: '{\"name\":\"plugin\"}' });

    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe(
      'Plugin manifest JSON'
    );
  });
});
