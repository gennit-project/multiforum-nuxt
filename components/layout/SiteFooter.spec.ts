import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SiteFooter from './SiteFooter.vue';

describe('SiteFooter', () => {
  const mountFooter = () =>
    mount(SiteFooter, {
      global: {
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    });

  it('links to the harmful or illegal content report form', () => {
    const wrapper = mountFooter();

    expect(
      wrapper
        .get('a[href="/support?type=content-report"]')
        .text()
    ).toBe('Report Harmful or Illegal Content');
  });

  it('links to the public server moderation issue list', () => {
    const wrapper = mountFooter();

    expect(wrapper.get('a[href="/server/issues"]').text()).toBe(
      'Moderation Issues'
    );
  });
});
