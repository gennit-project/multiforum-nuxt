import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SuspensionNotice from '@/components/SuspensionNotice.vue';

describe('SuspensionNotice', () => {
  it('renders issue link and expiration date', () => {
    const wrapper = mount(SuspensionNotice, {
      props: {
        issueNumber: 42,
        channelId: 'cats',
        suspendedUntil: '2031-03-01T00:00:00.000Z',
        suspendedIndefinitely: false,
      },
      global: {
        stubs: {
          'nuxt-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('View Issue #42');
    expect(wrapper.text()).toContain('Suspension expires on 2031-03-01.');
  });

  it('renders indefinite suspension message', () => {
    const wrapper = mount(SuspensionNotice, {
      props: {
        issueNumber: 7,
        channelId: 'dogs',
        suspendedIndefinitely: true,
      },
      global: {
        stubs: {
          'nuxt-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('View Issue #7');
    expect(wrapper.text()).toContain('Suspension is indefinite.');
  });
});
