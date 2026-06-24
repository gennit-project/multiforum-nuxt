import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginStatusCards from '@/components/admin/plugins/PluginStatusCards.vue';

const mountCards = (props: Record<string, unknown> = {}) =>
  mount(PluginStatusCards, {
    props: {
      isEnabled: false,
      installedVersion: '1.2.0',
      canEnable: true,
      enabling: false,
      ...props,
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().includes(text));

describe('PluginStatusCards installed', () => {
  it('shows the installed version', () => {
    const wrapper = mountCards();

    expect(wrapper.text()).toContain('v1.2.0');
  });
});

describe('PluginStatusCards enabled state', () => {
  it('shows the enabled card', () => {
    const wrapper = mountCards({ isEnabled: true });

    expect(wrapper.text()).toContain('Plugin Enabled');
  });

  it('emits toggle-enabled false from Disable', async () => {
    const wrapper = mountCards({ isEnabled: true });

    await buttonByText(wrapper, 'Disable')!.trigger('click');

    expect(wrapper.emitted('toggle-enabled')?.[0]).toEqual([false]);
  });
});

describe('PluginStatusCards disabled state', () => {
  it('shows the ready-to-enable message when it can be enabled', () => {
    const wrapper = mountCards({ isEnabled: false, canEnable: true });

    expect(wrapper.text()).toContain('Ready to enable');
  });

  it('emits toggle-enabled true from Enable', async () => {
    const wrapper = mountCards({ isEnabled: false, canEnable: true });

    await buttonByText(wrapper, 'Enable Plugin')!.trigger('click');

    expect(wrapper.emitted('toggle-enabled')?.[0]).toEqual([true]);
  });

  it('prompts to configure secrets when it cannot be enabled', () => {
    const wrapper = mountCards({ isEnabled: false, canEnable: false });

    expect(wrapper.text()).toContain('Configure required secrets first');
  });

  it('hides the Enable button when it cannot be enabled', () => {
    const wrapper = mountCards({ isEnabled: false, canEnable: false });

    expect(buttonByText(wrapper, 'Enable Plugin')).toBeUndefined();
  });

  it('disables the Enable button while enabling', () => {
    const wrapper = mountCards({ isEnabled: false, canEnable: true, enabling: true });

    expect(buttonByText(wrapper, 'Enable Plugin')!.attributes('disabled')).toBeDefined();
  });
});
