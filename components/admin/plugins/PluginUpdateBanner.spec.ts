import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginUpdateBanner from '@/components/admin/plugins/PluginUpdateBanner.vue';

const mountBanner = (props: Record<string, unknown> = {}) =>
  mount(PluginUpdateBanner, {
    props: {
      latestVersion: '2.0.0',
      installedVersion: '1.0.0',
      registryVersions: ['2.0.0'],
      installing: false,
      ...props,
    },
  });

describe('PluginUpdateBanner', () => {
  it('shows the update-available heading', () => {
    const wrapper = mountBanner();

    expect(wrapper.text()).toContain('Update Available');
  });

  it('shows the latest and installed versions', () => {
    const wrapper = mountBanner();

    expect(wrapper.text()).toContain('v2.0.0');
  });

  it('shows the registry version count when there are several', () => {
    const wrapper = mountBanner({ registryVersions: ['2.0.0', '1.5.0', '1.0.0'] });

    expect(wrapper.text()).toContain('3 versions available');
  });

  it('hides the registry count for a single version', () => {
    const wrapper = mountBanner({ registryVersions: ['2.0.0'] });

    expect(wrapper.text()).not.toContain('versions available');
  });

  it('emits install-latest when the update button is clicked', async () => {
    const wrapper = mountBanner();

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('install-latest')).toBeTruthy();
  });

  it('disables the button while installing', () => {
    const wrapper = mountBanner({ installing: true });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });
});
