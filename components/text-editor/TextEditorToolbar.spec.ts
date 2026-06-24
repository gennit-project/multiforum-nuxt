import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TextEditorToolbar from '@/components/text-editor/TextEditorToolbar.vue';

const mountToolbar = (props: Record<string, unknown> = {}) =>
  mount(TextEditorToolbar, { props, global: { stubs: { EyeSlashIcon: true } } });

const button = (w: ReturnType<typeof mount>, label: string) =>
  w.find(`button[aria-label="${label}"]`);

describe('TextEditorToolbar rendering', () => {
  it('renders the format buttons', () => {
    const wrapper = mountToolbar();

    expect(button(wrapper, 'B').exists()).toBe(true);
  });

  it('hides the fullscreen button by default', () => {
    const wrapper = mountToolbar();

    expect(button(wrapper, '⛶').exists()).toBe(false);
  });

  it('shows the fullscreen button when enabled', () => {
    const wrapper = mountToolbar({ showFullscreenButton: true });

    expect(button(wrapper, '⛶').exists()).toBe(true);
  });
});

describe('TextEditorToolbar actions', () => {
  it('emits format for a formatting button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'B').trigger('click');

    expect(wrapper.emitted('format')?.[0]).toEqual(['bold']);
  });

  it('emits toggle-emoji from the emoji button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'Emoji').trigger('click');

    expect(wrapper.emitted('toggle-emoji')).toBeTruthy();
  });

  it('emits toggle-fullscreen from the fullscreen button', async () => {
    const wrapper = mountToolbar({ showFullscreenButton: true });

    await button(wrapper, '⛶').trigger('click');

    expect(wrapper.emitted('toggle-fullscreen')).toBeTruthy();
  });

  it('does not emit format for the emoji button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'Emoji').trigger('click');

    expect(wrapper.emitted('format')).toBeUndefined();
  });
});
