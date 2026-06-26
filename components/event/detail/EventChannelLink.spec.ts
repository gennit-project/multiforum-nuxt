import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EventChannelLink from './EventChannelLink.vue';

const mountLink = (props: Record<string, unknown> = {}) =>
  mount(EventChannelLink, {
    props: {
      eventId: 'e1',
      channelId: 'cats',
      channelIcon: '',
      channelDisplayName: '',
      commentCount: 0,
      ...props,
    },
    global: {
      stubs: {
        'nuxt-link': { template: '<a><slot /></a>' },
        AvatarComponent: true,
      },
    },
  });

describe('EventChannelLink', () => {
  it('renders the channel unique name', () => {
    expect(mountLink().text()).toContain('cats');
  });

  it('renders the channel display name when provided', () => {
    expect(mountLink({ channelDisplayName: 'Cats Forum' }).text()).toContain(
      'Cats Forum'
    );
  });

  it('renders the channel avatar', () => {
    expect(
      mountLink().findComponent({ name: 'AvatarComponent' }).exists()
    ).toBe(true);
  });
});
