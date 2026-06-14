import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelLockedBanner from './ChannelLockedBanner.vue';

describe('ChannelLockedBanner', () => {
  it('displays lock reason when provided', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: 'Violation of community guidelines',
        lockedByDisplayName: 'AdminUser',
        lockedAt: '2024-01-15T10:00:00Z',
        issueNumber: 42,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Reason:');
    expect(wrapper.text()).toContain('Violation of community guidelines');
  });

  it('shows who locked the channel and when', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: 'Test reason',
        lockedByDisplayName: 'ModeratorAlice',
        lockedAt: '2024-01-15T10:00:00Z',
        issueNumber: 123,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Locked by @ModeratorAlice');
    expect(wrapper.text()).toContain('on');
  });

  it('shows "Unknown" when lockedByDisplayName is not provided', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: 'Test reason',
        lockedByDisplayName: null,
        lockedAt: null,
        issueNumber: 42,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Locked by @Unknown');
  });

  it('renders issue link when issueNumber is provided', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: 'Test reason',
        lockedByDisplayName: 'Admin',
        lockedAt: '2024-01-15T10:00:00Z',
        issueNumber: 42,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('View Issue');
    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('/admin/issues/42');
  });

  it('hides issue link when issueNumber is not provided', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: 'Test reason',
        lockedByDisplayName: 'Admin',
        lockedAt: '2024-01-15T10:00:00Z',
        issueNumber: null,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).not.toContain('View Issue');
  });

  it('displays locked message', () => {
    const wrapper = mount(ChannelLockedBanner, {
      props: {
        lockReason: null,
        lockedByDisplayName: 'Admin',
        lockedAt: null,
        issueNumber: null,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('This forum is locked');
    expect(wrapper.text()).toContain('New discussions, events, and comments are disabled');
  });
});
