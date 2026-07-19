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

    expect(button(wrapper, 'Bold').exists()).toBe(true);
  });

  it('gives icon/glyph buttons a full-word accessible name', () => {
    const wrapper = mountToolbar({ showFullscreenButton: true });

    expect(button(wrapper, 'Toggle fullscreen').exists()).toBe(true);
  });

  it('keeps the visible glyph on the bold button', () => {
    const wrapper = mountToolbar();

    expect(button(wrapper, 'Bold').text()).toBe('B');
  });

  it('hides the fullscreen button by default', () => {
    const wrapper = mountToolbar();

    expect(button(wrapper, 'Toggle fullscreen').exists()).toBe(false);
  });

  it('shows the fullscreen button when enabled', () => {
    const wrapper = mountToolbar({ showFullscreenButton: true });

    expect(button(wrapper, 'Toggle fullscreen').exists()).toBe(true);
  });
});

describe('TextEditorToolbar actions', () => {
  it('emits format for a formatting button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'Bold').trigger('click');

    expect(wrapper.emitted('format')?.[0]).toEqual(['bold']);
  });

  it('emits toggle-emoji from the emoji button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'Insert emoji').trigger('click');

    expect(wrapper.emitted('toggle-emoji')).toBeTruthy();
  });

  it('emits toggle-fullscreen from the fullscreen button', async () => {
    const wrapper = mountToolbar({ showFullscreenButton: true });

    await button(wrapper, 'Toggle fullscreen').trigger('click');

    expect(wrapper.emitted('toggle-fullscreen')).toBeTruthy();
  });

  it('does not emit format for the emoji button', async () => {
    const wrapper = mountToolbar();

    await button(wrapper, 'Insert emoji').trigger('click');

    expect(wrapper.emitted('format')).toBeUndefined();
  });
});
