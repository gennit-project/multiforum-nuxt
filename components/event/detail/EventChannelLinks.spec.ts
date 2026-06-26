import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { EventChannel } from '@/__generated__/graphql';
import EventChannelLinks from './EventChannelLinks.vue';

const channel = (name: string): EventChannel =>
  ({
    id: `ec-${name}`,
    channelUniqueName: name,
    eventId: 'e1',
    Channel: { displayName: name },
    CommentsAggregate: { count: 0 },
  }) as unknown as EventChannel;

const mountLinks = (props: Record<string, unknown>) =>
  mount(EventChannelLinks, {
    props,
    global: { stubs: { EventChannelLink: { template: '<li class="link" />' } } },
  });

describe('EventChannelLinks', () => {
  it('renders a link per channel when no active channel is set', () => {
    expect(
      mountLinks({ eventChannels: [channel('cats'), channel('dogs')] }).findAll(
        '.link'
      )
    ).toHaveLength(2);
  });

  it('excludes the active channel from the other-forums list', () => {
    expect(
      mountLinks({
        channelId: 'cats',
        eventChannels: [channel('cats'), channel('dogs')],
      }).findAll('.link')
    ).toHaveLength(1);
  });

  it('shows the submitted-to heading when no active channel', () => {
    expect(mountLinks({ eventChannels: [channel('cats')] }).text()).toContain(
      'submitted to the following forums'
    );
  });
});
