import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

import ChannelDownloadListItem from '@/components/discussion/list/ChannelDownloadListItem.vue';

const h = vi.hoisted(() => ({
  route: null as unknown,
  adminUsernames: null as unknown,
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: h.adminUsernames }),
}));

const makeChannel = (overrides: Record<string, unknown> = {}) =>
  ({
    discussionId: 'd1',
    channelUniqueName: 'cats',
    createdAt: '2024-01-01T00:00:00Z',
    CommentsAggregate: { count: 3 },
    archived: false,
    answered: false,
    isFavorited: false,
    ...overrides,
  }) as unknown as DiscussionChannel;

const makeDiscussion = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'd1',
    title: 'My Download',
    Author: { username: 'alice', displayName: 'Alice' },
    Tags: [{ text: '3d' }],
    Album: null,
    ...overrides,
  }) as unknown as Discussion;

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div><slot /></div>',
});

const nuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountItem = (
  discussion: Discussion | null,
  channel = makeChannel(),
  props: Record<string, unknown> = {}
) =>
  mount(ChannelDownloadListItem, {
    props: { discussionChannel: channel, discussion, ...props },
    global: {
      stubs: {
        NuxtLink: nuxtLinkStub,
        'nuxt-link': nuxtLinkStub,
        HighlightedSearchTerms: { props: ['text', 'searchInput'], template: '<span>{{ text }}</span>' },
        TagComponent: stub('TagComponent', ['tag', 'active'], ['click']),
        UsernameWithTooltip: stub('UsernameWithTooltip', ['username', 'isAdmin', 'isMod']),
        AddToDiscussionFavorites: stub('AddToDiscussionFavorites', ['discussionId']),
        DiscussionVotes: true,
        ErrorBanner: true,
        CheckCircleIcon: true,
        ImageIcon: true,
      },
    },
  });

const author = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'UsernameWithTooltip' });

beforeEach(() => {
  h.route = { params: { forumId: 'cats' }, query: {} };
  h.adminUsernames = ref<string[]>([]);
});

describe('ChannelDownloadListItem title', () => {
  it('shows the discussion title', () => {
    const wrapper = mountItem(makeDiscussion());

    expect(wrapper.text()).toContain('My Download');
  });

  it('falls back to [Deleted] for a missing title', () => {
    const wrapper = mountItem(makeDiscussion({ title: '' }));

    expect(wrapper.text()).toContain('[Deleted]');
  });
});

describe('ChannelDownloadListItem album image', () => {
  it('uses the first image in imageOrder when present', () => {
    const wrapper = mountItem(
      makeDiscussion({
        Album: {
          imageOrder: ['img2'],
          Images: [
            { id: 'img1', url: 'u1' },
            { id: 'img2', url: 'u2' },
          ],
        },
      })
    );

    expect(wrapper.get('img').attributes('src')).toBe('u2');
  });

  it('falls back to the first image when there is no order', () => {
    const wrapper = mountItem(
      makeDiscussion({ Album: { Images: [{ id: 'img1', url: 'u1' }] } })
    );

    expect(wrapper.get('img').attributes('src')).toBe('u1');
  });

  it('shows a placeholder when there is no album', () => {
    const wrapper = mountItem(makeDiscussion());

    expect(wrapper.text()).toContain('No image available');
  });
});

describe('ChannelDownloadListItem metadata', () => {
  it('shows the comment count', () => {
    const wrapper = mountItem(makeDiscussion(), makeChannel({ CommentsAggregate: { count: 7 } }));

    expect(wrapper.text()).toContain('7');
  });

  it('shows an archived badge when archived', () => {
    const wrapper = mountItem(makeDiscussion(), makeChannel({ archived: true }));

    expect(wrapper.text()).toContain('Archived');
  });

  it('shows an answered badge when answered', () => {
    const wrapper = mountItem(makeDiscussion(), makeChannel({ answered: true }));

    expect(wrapper.text()).toContain('Answered');
  });

  it('defaults the author username to Deleted when missing', () => {
    const wrapper = mountItem(makeDiscussion({ Author: null }));

    expect(author(wrapper).props('username')).toBe('Deleted');
  });
});

describe('ChannelDownloadListItem author badges', () => {
  it('marks the author as a server admin when listed', () => {
    h.adminUsernames = ref(['alice']);
    const wrapper = mountItem(makeDiscussion());

    expect(author(wrapper).props('isAdmin')).toBe(true);
  });

  it('marks the author as a mod when their channel role flags it', () => {
    const wrapper = mountItem(
      makeDiscussion({
        Author: { username: 'alice', ChannelRoles: [{ showModTag: true }] },
      })
    );

    expect(author(wrapper).props('isMod')).toBe(true);
  });
});

describe('ChannelDownloadListItem tags and actions', () => {
  it('renders a tag component per tag', () => {
    const wrapper = mountItem(
      makeDiscussion({ Tags: [{ text: '3d' }, { text: 'stl' }] })
    );

    expect(wrapper.findAllComponents({ name: 'TagComponent' })).toHaveLength(2);
  });

  it('emits filterByTag when a tag is clicked', async () => {
    const wrapper = mountItem(makeDiscussion());

    await wrapper.getComponent({ name: 'TagComponent' }).vm.$emit('click');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['3d']);
  });

  it('shows the album-view button when the album has images', async () => {
    const wrapper = mountItem(
      makeDiscussion({ Album: { Images: [{ id: 'i1', url: 'u1' }] } })
    );

    await wrapper.get('button[aria-label="View album"]').trigger('click');

    expect(wrapper.emitted('openAlbum')).toBeTruthy();
  });
});

describe('ChannelDownloadListItem links', () => {
  it('scopes the download link to the forum from the route', () => {
    const wrapper = mountItem(makeDiscussion());

    expect(
      (wrapper.getComponent({ name: 'NuxtLink' }).props('to') as {
        params: { forumId: string };
      }).params.forumId
    ).toBe('cats');
  });

  it('strips empty query params from the link', () => {
    h.route = { params: { forumId: 'cats' }, query: { a: '1', b: '' } };
    const wrapper = mountItem(makeDiscussion());

    expect(
      (wrapper.getComponent({ name: 'NuxtLink' }).props('to') as {
        query: Record<string, string>;
      }).query
    ).toEqual({ a: '1' });
  });
});
