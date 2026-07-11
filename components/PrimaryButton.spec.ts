import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PrimaryButton from '@/components/PrimaryButton.vue';

const mountButton = (props: Record<string, unknown> = {}, slot = '') =>
  mount(PrimaryButton, {
    props,
    slots: { default: slot },
    global: { stubs: { LoadingSpinner: { name: 'LoadingSpinner', template: '<span class="spinner" />' } } },
  });

const classes = (w: ReturnType<typeof mount>) => w.get('button').classes().join(' ');

describe('PrimaryButton content', () => {
  it('renders the label', () => {
    const wrapper = mountButton({ label: 'Save' });

    expect(wrapper.text()).toContain('Save');
  });

  it('renders slot content', () => {
    const wrapper = mountButton({}, 'Click me');

    expect(wrapper.text()).toContain('Click me');
  });

  it('shows a spinner while loading', () => {
    const wrapper = mountButton({ loading: true });

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('hides the spinner when not loading', () => {
    const wrapper = mountButton();

    expect(wrapper.find('.spinner').exists()).toBe(false);
  });
});

describe('PrimaryButton styling', () => {
  it('applies disabled styling and the disabled attribute', () => {
    const wrapper = mountButton({ disabled: true });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('uses gray styling when disabled', () => {
    const wrapper = mountButton({ disabled: true, backgroundColor: 'red' });

    expect(classes(wrapper)).toContain('bg-gray-200');
  });

  it.each([
    ['red', 'bg-red-500'],
    ['green', 'bg-green-500'],
    ['blue', 'bg-blue-500'],
    ['gray', 'bg-gray-500'],
  ])('uses %s styling', (backgroundColor, cls) => {
    const wrapper = mountButton({ backgroundColor });

    expect(classes(wrapper)).toContain(cls);
  });

  it('uses the default (orange) styling', () => {
    const wrapper = mountButton();

    expect(classes(wrapper)).toContain('bg-gray-800');
  });

  // Regression: focus:outline-none removes the native outline, so a focus:ring-2
  // width must be present or keyboard focus becomes invisible (WCAG 2.4.7).
  it('renders a focus ring width so keyboard focus stays visible', () => {
    const wrapper = mountButton();

    expect(classes(wrapper)).toContain('focus:ring-2');
  });

  it('pairs the focus ring width with a ring color', () => {
    const wrapper = mountButton();

    expect(/focus:ring-(red|green|blue|gray|orange)-\d/.test(classes(wrapper))).toBe(true);
  });
});
