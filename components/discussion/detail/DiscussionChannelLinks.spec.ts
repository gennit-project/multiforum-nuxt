import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { DiscussionChannel } from '@/__generated__/graphql';
import DiscussionChannelLinks from './DiscussionChannelLinks.vue';

const channel = (name: string): DiscussionChannel =>
  ({
    id: `dc-${name}`,
    channelUniqueName: name,
    discussionId: 'd1',
    Channel: { displayName: name },
    CommentsAggregate: { count: 1 },
    UpvotedByUsersAggregate: { count: 0 },
  }) as unknown as DiscussionChannel;

const mountLinks = (props: Record<string, unknown>) =>
  mount(DiscussionChannelLinks, {
    props,
    global: { stubs: { DiscussionChannelLink: { template: '<li class="link" />' } } },
  });

describe('DiscussionChannelLinks', () => {
  it('renders a link per channel when no active channel is set', () => {
    const wrapper = mountLinks({
      discussionChannels: [channel('cats'), channel('dogs')],
    });
    expect(wrapper.findAll('.link')).toHaveLength(2);
  });

  it('excludes the active channel from the "other forums" list', () => {
    const wrapper = mountLinks({
      channelId: 'cats',
      discussionChannels: [channel('cats'), channel('dogs')],
    });
    expect(wrapper.findAll('.link')).toHaveLength(1);
  });

  it('shows the "Comments in Forums" heading when no active channel', () => {
    const wrapper = mountLinks({ discussionChannels: [channel('cats')] });
    expect(wrapper.text()).toContain('Comments in Forums');
  });
});
