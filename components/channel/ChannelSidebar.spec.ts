import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ChannelSidebar from '@/components/channel/ChannelSidebar.vue';
import type { Channel } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ route: null as unknown, push: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/composables/useAuthState', () => ({ useIsAuthenticated: () => ref(true) }));

const channel = (overrides: Record<string, unknown> = {}) =>
  ({
    uniqueName: 'cats',
    displayName: 'Cats Forum',
    description: 'All about cats',
    rules: '[]',
    Tags: [{ text: 'pets' }],
    Admins: [{ username: 'alice' }],
    EventChannelsAggregate: { count: 7 },
    ...overrides,
  }) as unknown as Channel;

const tagStub = { name: 'Tag', props: ['tag'], emits: ['click'], template: '<button class="tag" @click="$emit(\'click\')">{{ tag }}</button>' };

const mountSidebar = (props: Record<string, unknown> = {}) =>
  mount(ChannelSidebar, {
    props: { channel: channel(), ...props },
    global: {
      stubs: {
        Tag: tagStub,
        TagComponent: tagStub,
        ChannelRules: { name: 'ChannelRules', props: ['rules'], template: '<div class="rules" />' },
        SidebarEventList: { name: 'SidebarEventList', props: ['eventChannelsAggregate'], template: '<div class="events" />' },
        MarkdownPreview: { name: 'MarkdownPreview', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        FontSizeControl: { name: 'FontSizeControl', template: '<div class="font-control" />' },
        BecomeAdminModal: { name: 'BecomeAdminModal', template: '<div />' },
        AddToChannelFavorites: {
          name: 'AddToChannelFavorites',
          props: ['initialIsFavorited'],
          template: '<div class="channel-favorite" />',
        },
        ExpandableImage: true,
        AvatarComponent: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats' }, name: 'forums-forumId' };
});

describe('ChannelSidebar content', () => {
  it('shows the channel display name', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Cats Forum');
  });

  it('passes computed favorite state to the favorite button', () => {
    const wrapper = mountSidebar({
      channel: channel({ isFavorited: true }),
    });

    expect(
      wrapper.getComponent({ name: 'AddToChannelFavorites' }).props('initialIsFavorited')
    ).toBe(true);
  });

  it('renders the description', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('.md').text()).toBe('All about cats');
  });

  it('shows a welcome message without a description', () => {
    const wrapper = mountSidebar({ channel: channel({ description: '' }) });

    expect(wrapper.text()).toContain('Welcome to cats');
  });

  it('shows the admins', () => {
    const wrapper = mountSidebar();

    expect(wrapper.text()).toContain('Admins');
  });

  it('passes the event aggregate to the sidebar event list', () => {
    const wrapper = mountSidebar();

    expect(
      wrapper.getComponent({ name: 'SidebarEventList' }).props('eventChannelsAggregate')
    ).toBe(7);
  });

  it('renders pinned wiki page links', () => {
    const wrapper = mountSidebar({
      channel: channel({
        PinnedWikiPages: [{ id: 'wiki-1', title: 'Install Guide', slug: 'install' }],
      }),
    });

    expect(wrapper.text()).toContain('Install Guide');
  });

  it('hides the pinned wiki section when no pages are pinned', () => {
    const wrapper = mountSidebar({
      channel: channel({ PinnedWikiPages: [] }),
    });

    expect(wrapper.text()).not.toContain('Pinned Wiki Pages');
  });
});

describe('ChannelSidebar rules', () => {
  it('hides the rules section for empty rules', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('.rules').exists()).toBe(false);
  });

  it('shows the rules section when rules exist', () => {
    const wrapper = mountSidebar({
      channel: channel({ rules: '[{"summary":"Be nice"}]' }),
    });

    expect(wrapper.find('.rules').exists()).toBe(true);
  });
});

describe('ChannelSidebar tags', () => {
  it('renders a tag per channel tag', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('.tag').text()).toBe('pets');
  });

  it('filters by tag on click', async () => {
    const wrapper = mountSidebar();

    await wrapper.find('.tag').trigger('click');

    expect(h.push).toHaveBeenCalledWith({ name: 'forums', query: { tag: 'pets' } });
  });
});

describe('ChannelSidebar discussion detail', () => {
  it('hides the font-size control off the discussion detail page', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('.font-control').exists()).toBe(false);
  });

  it('shows the font-size control on the discussion detail page', () => {
    h.route = {
      params: { forumId: 'cats' },
      name: 'forums-forumId-discussions-discussionId',
    };
    const wrapper = mountSidebar();

    expect(wrapper.find('.font-control').exists()).toBe(true);
  });
});
