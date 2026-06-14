import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SiteFooter from './SiteFooter.vue';

describe('SiteFooter', () => {
  it('links to the harmful or illegal content report form', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

    expect(
      wrapper
        .get('a[href="/support?type=content-report"]')
        .text()
    ).toBe('Report Harmful or Illegal Content');
  });
});
