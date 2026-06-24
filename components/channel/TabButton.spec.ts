import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import TabButton from '@/components/channel/TabButton.vue';

const h = vi.hoisted(() => ({ route: null as unknown }));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

const mountTab = (props: Record<string, unknown> = {}, slot = '') =>
  mount(TabButton, {
    props: { to: '/forums/cats', label: 'Discussions', ...props },
    slots: { default: slot },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :class="$attrs.class"><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a :class="$attrs.class"><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { path: '/forums/dogs' };
});

describe('TabButton content', () => {
  it('renders the label', () => {
    const wrapper = mountTab();

    expect(wrapper.text()).toContain('Discussions');
  });

  it('renders the slot (icon)', () => {
    const wrapper = mountTab({}, '<span class="icon">i</span>');

    expect(wrapper.find('.icon').exists()).toBe(true);
  });

  it('shows the count when enabled', () => {
    const wrapper = mountTab({ showCount: true, count: 7 });

    expect(wrapper.text()).toContain('7');
  });

  it('hides the count when showCount is false', () => {
    const wrapper = mountTab({ showCount: false, count: 7 });

    expect(wrapper.text()).not.toContain('7');
  });
});

describe('TabButton active state', () => {
  it('is active when the isActive prop is true', () => {
    const wrapper = mountTab({ isActive: true });

    expect(wrapper.find('a').classes()).toContain('border-orange-500');
  });

  it('is active when the route path matches', () => {
    h.route = { path: '/forums/cats' };
    const wrapper = mountTab();

    expect(wrapper.find('a').classes()).toContain('border-orange-500');
  });

  it('is inactive when the path does not match', () => {
    const wrapper = mountTab();

    expect(wrapper.find('a').classes()).toContain('text-gray-500');
  });

  it('uses background highlight for an active vertical tab', () => {
    const wrapper = mountTab({ isActive: true, vertical: true });

    expect(wrapper.find('a').classes()).toContain('bg-gray-100');
  });
});

describe('TabButton hover', () => {
  it('highlights on hover for a horizontal tab', async () => {
    const wrapper = mountTab();

    await wrapper.find('a').trigger('mouseenter');

    expect(wrapper.html()).toContain('bg-gray-100');
  });
});
