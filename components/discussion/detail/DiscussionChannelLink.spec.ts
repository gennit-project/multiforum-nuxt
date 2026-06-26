import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DiscussionChannelLink from './DiscussionChannelLink.vue';

const mountLink = (props: Record<string, unknown>) =>
  mount(DiscussionChannelLink, {
    props: {
      discussionId: 'd1',
      channelId: 'cats',
      commentCount: 3,
      ...props,
    },
    global: {
      stubs: {
        'nuxt-link': { template: '<a><slot /></a>' },
        AvatarComponent: true,
      },
    },
  });

describe('DiscussionChannelLink', () => {
  it('renders the comment count', () => {
    expect(mountLink({ commentCount: 3 }).text()).toContain('3 comments');
  });

  it('uses the singular noun for one upvote', () => {
    expect(mountLink({ upvoteCount: 1 }).text()).toContain('1 upvote');
  });

  it('uses the plural noun for multiple upvotes', () => {
    expect(mountLink({ upvoteCount: 2 }).text()).toContain('2 upvotes');
  });

  it('renders the channel display name when provided', () => {
    expect(
      mountLink({ channelDisplayName: 'Cats Forum' }).text()
    ).toContain('Cats Forum');
  });
});
