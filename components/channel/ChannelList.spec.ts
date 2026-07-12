import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import ChannelList from '@/components/channel/ChannelList.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const itemStub = defineComponent({
  name: 'ChannelListItem',
  props: ['channel', 'downloadCount', 'searchInput', 'selectedTags'],
  emits: ['filterByTag'],
  template: '<button class="channel-item-stub" @click="$emit(\'filterByTag\', channel.uniqueName)">{{ channel.displayName }}</button>',
});

const loadMoreStub = defineComponent({
  name: 'LoadMore',
  props: ['loading', 'reachedEndOfResults'],
  emits: ['loadMore'],
  template: '<button class="load-more-stub" @click="$emit(\'loadMore\')">load more</button>',
});

const channels = [
  {
    uniqueName: 'cats',
    displayName: 'Cats Forum',
    downloadCount: 3,
  },
  {
    uniqueName: 'dogs',
    displayName: 'Dogs Forum',
    downloadCount: 0,
  },
];

const mountList = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ChannelList, {
    props: {
      channels,
      resultCount: 10,
      searchInput: 'cat',
      selectedTags: ['pets'],
      loading: false,
      ...props,
    },
    global: {
      stubs: {
        ChannelListItem: itemStub,
        LoadMore: loadMoreStub,
      },
    },
  });

describe('ChannelList', () => {
  it('shows the empty state when there are no channels', () => {
    const wrapper = mountList({ channels: [] });

    expect(wrapper.text()).toContain('There are no results.');
  });

  it('renders one list item per channel', () => {
    const wrapper = mountList();

    expect(wrapper.findAll('.channel-item-stub')).toHaveLength(2);
  });

  it('passes the search input through to each row', () => {
    const wrapper = mountList();

    expect(wrapper.findAllComponents(itemStub)[0].props('searchInput')).toBe('cat');
  });

  it('passes the selected tags through to each row', () => {
    const wrapper = mountList();

    expect(wrapper.findAllComponents(itemStub)[0].props('selectedTags')).toEqual(['pets']);
  });

  it('uses zero when a channel has no download count', () => {
    const wrapper = mountList();

    expect(wrapper.findAllComponents(itemStub)[1].props('downloadCount')).toBe(0);
  });

  it('re-emits filterByTag from a child row', async () => {
    const wrapper = mountList();

    await wrapper.findAll('.channel-item-stub')[0].trigger('click');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['cats']);
  });

  it('marks LoadMore as reached when the result count equals the channel count', () => {
    const wrapper = mountList({ resultCount: 2 });

    expect(wrapper.getComponent(loadMoreStub).props('reachedEndOfResults')).toBe(true);
  });

  it('re-emits loadMore from the footer control', async () => {
    const wrapper = mountList();

    await wrapper.get('.load-more-stub').trigger('click');

    expect(wrapper.emitted('loadMore')?.length).toBe(1);
  });
});
