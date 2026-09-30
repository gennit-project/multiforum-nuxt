import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';

import DefaultLayout from '@/layouts/default.vue';

const h = vi.hoisted(() => ({
  useHead: vi.fn(),
  branding: { value: { faviconUrl: '', primaryColor: '' } },
}));

vi.mock('nuxt/app', () => ({
  useHead: h.useHead,
  useRoute: () => ({ name: 'home', query: {} }),
}));

vi.mock('@/composables/useDisplay', () => ({
  useDisplay: () => ({ lgAndUp: ref(true), mdAndUp: ref(true) }),
}));

vi.mock('@/composables/useTestAuthHelpers', () => ({
  useTestAuthHelpers: vi.fn(),
}));

vi.mock('@/composables/useBranding', () => ({
  useBranding: () => ({
    branding: h.branding,
  }),
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

const resolvedHeadEntries = () =>
  h.useHead.mock.calls.map(([entry]) =>
    typeof entry === 'function' ? entry() : entry
  );

beforeEach(() => {
  h.useHead.mockClear();
  h.branding.value = { faviconUrl: '', primaryColor: '' };
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

    expect(wrapper.get('main').find('[data-testid="page"]').exists()).toBe(
      true
    );
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

describe('default layout branding head', () => {
  it('applies the configured favicon', () => {
    h.branding.value = { faviconUrl: '/favicon.svg', primaryColor: '' };
    mountLayout();

    expect(
      resolvedHeadEntries().flatMap((entry) => entry.link ?? [])
    ).toContainEqual({
      key: 'branding-favicon',
      rel: 'icon',
      href: '/favicon.svg',
    });
  });

  it('injects the configured primary colour palette', () => {
    h.branding.value = { faviconUrl: '', primaryColor: '#2563eb' };
    mountLayout();

    expect(
      resolvedHeadEntries()
        .flatMap((entry) => entry.style ?? [])
        .some((style) =>
          style.textContent.includes('--color-brand-500:#2563eb')
        )
    ).toBe(true);
  });
});
