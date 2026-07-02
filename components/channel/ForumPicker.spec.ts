import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import ForumPicker from '@/components/channel/ForumPicker.vue';

const h = vi.hoisted(() => ({
  queryCallCount: 0,
  channelResult: { channels: [] as Array<Record<string, unknown>> },
  favoritesResult: {
    users: [{ FavoriteChannels: [] as Array<Record<string, unknown>> }],
  },
  collectionsResult: {
    users: [{ Collections: [] as Array<Record<string, unknown>> }],
  },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => {
    h.queryCallCount += 1;

    if (h.queryCallCount === 1) {
      return { loading: ref(false), result: ref(h.channelResult) };
    }

    if (h.queryCallCount === 2) {
      return { loading: ref(false), result: ref(h.favoritesResult) };
    }

    return { loading: ref(false), result: ref(h.collectionsResult) };
  }),
}));

vi.mock('@/graphQLData/channel/queries', () => ({
  GET_CHANNEL_NAMES: {},
  GET_USER_FAVORITE_CHANNELS: {},
}));

vi.mock('@/graphQLData/collection/queries', () => ({
  GET_USER_CHANNEL_COLLECTIONS_WITH_CHANNELS: {},
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref(''),
  useIsAuthenticated: () => ref(false),
}));

const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn(),
};

describe('ForumPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.queryCallCount = 0;
    h.channelResult = { channels: [] };
    h.favoritesResult = { users: [{ FavoriteChannels: [] }] };
    h.collectionsResult = { users: [{ Collections: [] }] };
  });

  function createWrapper(props = {}) {
    return mount(ForumPicker, {
      props: {
        selectedChannels: [],
        description: 'Select forums',
        testId: 'forum-picker',
        ...props,
      },
      global: {
        directives: {
          'click-outside': clickOutsideDirective,
        },
      },
    });
  }

  it('renders correctly with default props', () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain('Select forums');
    expect(wrapper.findComponent({ name: 'MultiSelect' }).exists()).toBe(true);
  });

  it('displays the selected channels as chips', () => {
    const wrapper = createWrapper({
      selectedChannels: ['forum1', 'forum2'],
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['forum1', 'forum2']);
  });

  it('emits updated selections from the MultiSelect bridge', async () => {
    const wrapper = createWrapper();

    await wrapper.vm.handleUpdateChannels(['forum1']);
    await wrapper.vm.handleUpdateChannels([]);

    expect(wrapper.emitted('setSelectedChannels')).toEqual([
      [['forum1']],
      [[]],
    ]);
  });

  it('only shows eligible event forums by default', () => {
    h.channelResult = {
      channels: [
        { uniqueName: 'cats', displayName: 'Cats', channelIconURL: '', eventsEnabled: true },
        { uniqueName: 'dogs', displayName: 'Dogs', channelIconURL: '', eventsEnabled: false },
      ],
    };

    const wrapper = createWrapper({
      requiredEnabledChannelFlags: ['eventsEnabled'],
    });

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    const allForumsSection = multiSelect
      .props('sections')
      .find((section: { title: string }) => section.title === 'Forums (Top 10)');

    expect(allForumsSection.options).toEqual([
      expect.objectContaining({ value: 'cats', disabled: false }),
    ]);
  });

  it('shows unavailable event forums as disabled search results with a reason', async () => {
    h.channelResult = {
      channels: [
        { uniqueName: 'cats', displayName: 'Cats', channelIconURL: '', eventsEnabled: true },
        { uniqueName: 'dogs', displayName: 'Dogs', channelIconURL: '', eventsEnabled: false },
      ],
    };

    const wrapper = createWrapper({
      requiredEnabledChannelFlags: ['eventsEnabled'],
    });

    await wrapper.vm.handleSearch('dogs');
    await nextTick();

    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    const allForumsSection = multiSelect
      .props('sections')
      .find((section: { title: string }) => section.title === 'Forums (Top 10)');

    expect(allForumsSection.options).toContainEqual(
      expect.objectContaining({
        value: 'dogs',
        disabled: true,
        description: 'Does not allow events',
      })
    );
  });

  it('renders a locked forum instead of an interactive picker', () => {
    const wrapper = createWrapper({
      lockedChannelName: 'cats',
      lockedChannelLabel: 'Cats',
      lockedDescription: 'This event will be posted to the current forum.',
    });

    expect(wrapper.findComponent({ name: 'MultiSelect' }).exists()).toBe(false);
    expect(wrapper.get('[data-testid="forum-picker"]').text()).toContain('cats');
    expect(wrapper.text()).toContain(
      'This event will be posted to the current forum.'
    );
  });
});
