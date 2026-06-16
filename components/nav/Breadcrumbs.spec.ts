import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import Breadcrumbs from '@/components/nav/Breadcrumbs.vue';

const stubs = {
  // Render NuxtLink as a plain anchor so we can assert label + href.
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
};

const mountCrumbs = (links: Array<{ path: string; label: string }>) =>
  mountWithDefaults(Breadcrumbs, {
    props: { links },
    global: { stubs },
  });

describe('Breadcrumbs', () => {
  it('renders one list item per link', () => {
    const wrapper = mountCrumbs([
      { path: 'forums', label: 'Forums' },
      { path: 'forums/cats', label: 'Cats' },
    ]);
    expect(wrapper.findAll('li')).toHaveLength(2);
  });

  it('renders each link label', () => {
    const wrapper = mountCrumbs([{ path: 'forums', label: 'Forums' }]);
    expect(wrapper.text()).toContain('Forums');
  });

  it('builds the link href from the path', () => {
    const wrapper = mountCrumbs([{ path: 'forums/cats', label: 'Cats' }]);
    expect(wrapper.get('a').attributes('href')).toBe('/forums/cats/');
  });

  it('does not render a chevron before the first crumb', () => {
    const wrapper = mountCrumbs([{ path: 'forums', label: 'Forums' }]);
    expect(wrapper.find('svg').exists()).toBe(false);
  });

  it('renders a chevron before subsequent crumbs', () => {
    const wrapper = mountCrumbs([
      { path: 'forums', label: 'Forums' },
      { path: 'forums/cats', label: 'Cats' },
    ]);
    expect(wrapper.findAll('svg')).toHaveLength(1);
  });
});
