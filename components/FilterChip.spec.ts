import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import FilterChip from '@/components/FilterChip.vue';

const mountChip = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(FilterChip, {
    props,
    slots,
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        Popper: { name: 'Popper', template: '<div><slot /><slot name="content" /></div>' },
        ChevronDownIcon: true,
      },
    },
  });

const button = (w: ReturnType<typeof mount>) => w.find('[data-testid="filter-button"]');

describe('FilterChip', () => {
  it('renders the label', () => {
    const wrapper = mountChip({ label: 'Tags' });

    expect(wrapper.text()).toContain('Tags');
  });

  it('uses the default label', () => {
    const wrapper = mountChip();

    expect(wrapper.text()).toContain('No label');
  });

  it('applies highlighted styling', () => {
    const wrapper = mountChip({ highlighted: true });

    expect(button(wrapper).classes().join(' ')).toContain('ring-1');
  });

  it('emits click when the chip is clicked', async () => {
    const wrapper = mountChip();

    await button(wrapper).trigger('click');

    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('renders the icon slot', () => {
    const wrapper = mountChip({}, { icon: '<span class="icon" />' });

    expect(wrapper.find('.icon').exists()).toBe(true);
  });

  it('renders the content slot', () => {
    const wrapper = mountChip({}, { content: '<div class="panel" />' });

    expect(wrapper.find('.panel').exists()).toBe(true);
  });

  it('uses a custom data-testid', () => {
    const wrapper = mountChip({ dataTestid: 'sort-button' });

    expect(wrapper.find('[data-testid="sort-button"]').exists()).toBe(true);
  });
});
