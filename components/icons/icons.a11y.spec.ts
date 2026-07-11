import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Component } from 'vue';

// Every icon SVG is decorative by default: its accessible name (when needed)
// comes from the interactive element wrapping it, so the SVG itself must be
// hidden from assistive tech. This guards the convention for new icons too.
const modules = import.meta.glob('./*.vue', { eager: true }) as Record<
  string,
  { default: Component }
>;

// MessageIcon has a bare <path> root (no <svg>), so the convention doesn't apply.
const entries = Object.entries(modules).filter(
  ([path]) => !path.includes('MessageIcon.vue')
);

describe('icon components are decorative by default', () => {
  // Most icons are <svg>, a few wrap a Font Awesome <i> in a <span>; in every
  // case the component's root element must be hidden from assistive tech.
  it.each(entries)('%s hides its root element from assistive tech', (_path, mod) => {
    const wrapper = mount(mod.default);

    expect(wrapper.element.getAttribute('aria-hidden')).toBe('true');
  });
});
