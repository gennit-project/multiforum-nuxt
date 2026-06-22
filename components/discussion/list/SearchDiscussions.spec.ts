import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import SearchDiscussions from '@/components/discussion/list/SearchDiscussions.vue';

// Drive the router/route ourselves. The global tests/setup.ts mock of nuxt/app
// has no router.replace (which this component calls), so override it per-file
// with a reactive route we can mutate to exercise the query-mutation branches
// and the watchers.
const nuxt = vi.hoisted(() => ({
  route: { params: {}, query: {} },
  replace: vi.fn(),
  push: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => nuxt.route,
  useRouter: () => ({ replace: nuxt.replace, push: nuxt.push }),
  useState: <T>(_k: string, init?: () => T) => ref(init ? init() : undefined),
  useNuxtApp: () => ({ $apollo: { default: { query: vi.fn() } } }),
  navigateTo: vi.fn(),
  useRuntimeConfig: () => ({ public: {} }),
}));

const childStub = (name: string, props: string[] = []) => ({
  name,
  props,
  template: '<div><slot /></div>',
});

const mountSearch = (props: Record<string, unknown> = {}) =>
  mount(SearchDiscussions, {
    props,
    global: {
      stubs: {
        SitewideDiscussionList: childStub('SitewideDiscussionList'),
        ChannelDiscussionList: childStub('ChannelDiscussionList', [
          'channelId',
          'searchInput',
          'selectedTags',
          'selectedChannels',
        ]),
        DiscussionFilterBar: childStub('DiscussionFilterBar', ['isForumScoped']),
      },
    },
  });

const lastReplaceQuery = () => nuxt.replace.mock.calls.at(-1)?.[0]?.query;

beforeEach(() => {
  nuxt.route = reactive({ params: {}, query: {} });
  nuxt.replace.mockReset();
  nuxt.push.mockReset();
});

describe('SearchDiscussions rendering', () => {
  it('renders the sitewide list when not forum-scoped', () => {
    const wrapper = mountSearch({ isForumScoped: false });

    expect(
      wrapper.findComponent({ name: 'SitewideDiscussionList' }).exists()
    ).toBe(true);
  });

  it('renders the channel list when forum-scoped', () => {
    const wrapper = mountSearch({ isForumScoped: true });

    expect(
      wrapper.findComponent({ name: 'ChannelDiscussionList' }).exists()
    ).toBe(true);
  });

  it('seeds channelId from the forumId route param', () => {
    nuxt.route = reactive({ params: { forumId: 'cats' }, query: {} });
    const wrapper = mountSearch({ isForumScoped: true });

    expect(
      wrapper.findComponent({ name: 'ChannelDiscussionList' }).props('channelId')
    ).toBe('cats');
  });
});

describe('SearchDiscussions tag filtering', () => {
  const clickTag = async (wrapper: ReturnType<typeof mount>, tag: string) => {
    await wrapper
      .findComponent({ name: 'SitewideDiscussionList' })
      .vm.$emit('filter-by-tag', tag);
  };

  it('adds a tag to the query when not already filtering by it', async () => {
    const wrapper = mountSearch();

    await clickTag(wrapper, 'vue');

    expect(lastReplaceQuery().tags).toEqual(['vue']);
  });

  it('clears the tag when it is the only active tag', async () => {
    nuxt.route = reactive({ params: {}, query: { tags: 'vue' } });
    const wrapper = mountSearch();

    await clickTag(wrapper, 'vue');

    expect(lastReplaceQuery().tags).toBeUndefined();
  });

  it('removes only the clicked tag when several are active', async () => {
    nuxt.route = reactive({ params: {}, query: { tags: ['vue', 'nuxt'] } });
    const wrapper = mountSearch();

    await clickTag(wrapper, 'vue');

    expect(lastReplaceQuery().tags).toEqual(['nuxt']);
  });
});

describe('SearchDiscussions channel filtering', () => {
  const clickChannel = async (
    wrapper: ReturnType<typeof mount>,
    channel: string
  ) => {
    await wrapper
      .findComponent({ name: 'SitewideDiscussionList' })
      .vm.$emit('filter-by-channel', channel);
  };

  it('adds a channel to the query when not already filtering by it', async () => {
    const wrapper = mountSearch();

    await clickChannel(wrapper, 'cats');

    expect(lastReplaceQuery().channels).toEqual(['cats']);
  });

  it('clears the channel when it is the only active channel', async () => {
    nuxt.route = reactive({ params: {}, query: { channels: 'cats' } });
    const wrapper = mountSearch();

    await clickChannel(wrapper, 'cats');

    expect(lastReplaceQuery().channels).toBeUndefined();
  });

  it('removes only the clicked channel when several are active', async () => {
    nuxt.route = reactive({ params: {}, query: { channels: ['cats', 'dogs'] } });
    const wrapper = mountSearch();

    await clickChannel(wrapper, 'cats');

    expect(lastReplaceQuery().channels).toEqual(['dogs']);
  });
});

describe('SearchDiscussions route watchers', () => {
  it('updates channelId when the forumId route param changes', async () => {
    const wrapper = mountSearch({ isForumScoped: true });

    nuxt.route.params.forumId = 'dogs';
    await nextTick();

    expect(
      wrapper.findComponent({ name: 'ChannelDiscussionList' }).props('channelId')
    ).toBe('dogs');
  });

  it('recomputes filter values when the query changes', async () => {
    const wrapper = mountSearch({ isForumScoped: true });

    nuxt.route.query = { tags: ['vue'] };
    await nextTick();

    expect(
      wrapper
        .findComponent({ name: 'ChannelDiscussionList' })
        .props('selectedTags')
    ).toEqual(['vue']);
  });
});
