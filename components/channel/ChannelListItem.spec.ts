import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ChannelListItem from '@/components/channel/ChannelListItem.vue';
import type { Channel } from '@/__generated__/graphql';

const channel = (overrides: Record<string, unknown> = {}) =>
  ({
    uniqueName: 'cats',
    displayName: 'Cats Forum',
    description: 'All about cats',
    Tags: [{ text: 'pets' }, { text: 'cute' }],
    DiscussionChannelsAggregate: { count: 12 },
    EventChannelsAggregate: { count: 0 },
    ...overrides,
  }) as unknown as Channel;

const highlightStub = { name: 'HighlightedSearchTerms', props: ['text', 'searchInput'], template: '<span>{{ text }}</span>' };
const tagStub = { name: 'Tag', props: ['tag', 'active'], emits: ['click'], template: '<button class="tag" @click="$emit(\'click\')">{{ tag }}</button>' };

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(ChannelListItem, {
    props: { channel: channel(), ...props },
    global: {
      stubs: {
        HighlightedSearchTerms: highlightStub,
        Tag: tagStub,
        TagComponent: tagStub,
        AvatarComponent: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
        DiscussionIcon: true,
        DownloadIcon: true,
        CalendarIcon: true,
      },
    },
  });

describe('ChannelListItem content', () => {
  it('shows the display name', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('Cats Forum');
  });

  it('shows the unique name', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('cats');
  });

  it('shows the description', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('All about cats');
  });
});

describe('ChannelListItem tags', () => {
  it('renders a tag per channel tag', () => {
    const wrapper = mountItem();

    expect(wrapper.findAll('.tag')).toHaveLength(2);
  });

  it('caps the tags at five with a +more indicator', () => {
    const wrapper = mountItem({
      channel: channel({ Tags: Array.from({ length: 8 }, (_, i) => ({ text: `t${i}` })) }),
    });

    expect(wrapper.text()).toContain('+3 more');
  });

  it('marks a selected tag active', () => {
    const wrapper = mountItem({ selectedTags: ['pets'] });

    expect(wrapper.getComponent(tagStub).props('active')).toBe(true);
  });

  it('emits filterByTag when a tag is clicked', async () => {
    const wrapper = mountItem();

    await wrapper.find('.tag').trigger('click');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['pets']);
  });
});

describe('ChannelListItem stats', () => {
  it('shows the discussion count', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('12');
  });

  it('shows the download count when there are downloads', () => {
    const wrapper = mountItem({ downloadCount: 4 });

    expect(wrapper.text()).toContain('4');
  });

  it('hides downloads when the count is zero', () => {
    const wrapper = mountItem({ downloadCount: 0 });

    expect(wrapper.text()).not.toContain('Downloads');
  });

  it('shows events when there are event channels', () => {
    const wrapper = mountItem({
      channel: channel({ EventChannelsAggregate: { count: 3 } }),
    });

    expect(wrapper.text()).toContain('Events');
  });
});
