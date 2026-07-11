import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';

import DefaultLayout from '@/layouts/default.vue';

vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
  useRoute: () => ({ name: 'home', query: {} }),
}));

vi.mock('@/composables/useDisplay', () => ({
  useDisplay: () => ({ lgAndUp: ref(true), mdAndUp: ref(true) }),
}));

vi.mock('@/composables/useTestAuthHelpers', () => ({
  useTestAuthHelpers: vi.fn(),
}));

vi.mock('@/config', () => ({
  config: { environment: 'test' },
}));

vi.mock('@/cache', () => ({
  sideNavIsOpenVar: ref(false),
  setSideNavIsOpenVar: vi.fn(),
}));

const mountLayout = () =>
  shallowMount(DefaultLayout, {
    slots: { default: '<p data-testid="page">Page content</p>' },
    global: {
      stubs: { ClientOnly: { template: '<div><slot /></div>' } },
    },
  });

describe('default layout landmarks', () => {
  it('renders a skip link that targets the main content region', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('a[href="#main-content"]').exists()).toBe(true);
  });

  it('exposes exactly one main landmark', () => {
    const wrapper = mountLayout();

    expect(wrapper.findAll('main')).toHaveLength(1);
  });

  it('gives the main landmark the skip-link target id', () => {
    const wrapper = mountLayout();

    expect(wrapper.get('main').attributes('id')).toBe('main-content');
  });

  it('renders the page slot inside the main landmark', () => {
    const wrapper = mountLayout();

    expect(wrapper.get('main').find('[data-testid="page"]').exists()).toBe(true);
  });

  it('keeps the banner header outside the main landmark', () => {
    const wrapper = mountLayout();

    expect(wrapper.get('main').find('header').exists()).toBe(false);
  });

  it('keeps the footer outside the main landmark', () => {
    const wrapper = mountLayout();

    expect(wrapper.get('main').find('footer').exists()).toBe(false);
  });

  it('keeps navigation landmarks outside the main landmark', () => {
    const wrapper = mountLayout();

    expect(wrapper.get('main').find('nav').exists()).toBe(false);
  });
});
