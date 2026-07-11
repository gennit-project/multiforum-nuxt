import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SecondaryButton from '@/components/SecondaryButton.vue';

const mountButton = (props: Record<string, unknown> = {}, slot = '') =>
  mount(SecondaryButton, {
    props: { label: '', ...props },
    slots: { default: slot },
  });

const classes = (w: ReturnType<typeof mount>) => w.get('button').classes().join(' ');

describe('SecondaryButton content', () => {
  it('renders the label', () => {
    const wrapper = mountButton({ label: 'Cancel' });

    expect(wrapper.text()).toContain('Cancel');
  });

  it('renders slot content', () => {
    const wrapper = mountButton({}, 'Click me');

    expect(wrapper.text()).toContain('Click me');
  });
});

describe('SecondaryButton styling', () => {
  it('applies the disabled attribute', () => {
    const wrapper = mountButton({ disabled: true });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('uses disabled styling when disabled', () => {
    const wrapper = mountButton({ disabled: true });

    expect(classes(wrapper)).toContain('cursor-default');
  });

  // Regression: focus:outline-none removes the native outline, so a focus:ring-2
  // width must be present or keyboard focus becomes invisible (WCAG 2.4.7).
  it('renders a focus ring width so keyboard focus stays visible', () => {
    const wrapper = mountButton();

    expect(classes(wrapper)).toContain('focus:ring-2');
  });

  it('pairs the focus ring width with a ring color', () => {
    const wrapper = mountButton();

    expect(classes(wrapper)).toContain('focus:ring-orange-500');
  });
});
