import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import LibraryDiscussionCard from '@/components/library/LibraryDiscussionCard.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const discussionAlbumStub = defineComponent({
  name: 'DiscussionAlbum',
  props: ['album', 'discussionId', 'discussionAuthor', 'carouselFormat', 'showEditAlbum'],
  template: '<div class="discussion-album-stub" />',
});

const usernameStub = defineComponent({
  name: 'UsernameWithTooltip',
  props: ['username', 'displayName'],
  template: '<div>{{ displayName || username }}</div>',
});

const markdownStub = defineComponent({
  name: 'MarkdownRenderer',
  props: ['text'],
  template: '<div>{{ text }}</div>',
});

const tagStub = defineComponent({
  name: 'TagComponent',
  props: ['tag'],
  template: '<div class="tag-stub">{{ tag }}</div>',
});

const favoriteStub = defineComponent({
  name: 'AddToDiscussionFavorites',
  props: [
    'allowAddToList',
    'discussionId',
    'discussionTitle',
    'initialIsFavorited',
    'entityName',
    'size',
  ],
  template: '<div class="favorite-stub" />',
});

const mountCard = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LibraryDiscussionCard, {
    props: {
      discussion: {
        id: 'discussion-1',
        title: 'Best build ideas',
        body: 'A markdown body',
        createdAt: '2024-01-01T00:00:00Z',
        hasSensitiveContent: false,
        Tags: [{ text: 'builds' }, { text: 'mods' }],
        Album: null,
      },
      discussionLink: '/discussions/1',
      channelLink: '/forums/sims4',
      channelUniqueName: 'sims4',
      authorInfo: {
        username: 'alice',
        displayName: 'Alice',
        profilePicURL: '',
        commentKarma: 1,
        discussionKarma: 2,
        createdAt: '2023-01-01T00:00:00Z',
        isAdmin: false,
      },
      commentCount: 2,
      forumCount: 1,
      showFavoriteButton: true,
      allowAddToList: false,
      isFavorited: false,
      favoriteEntityName: 'Discussion',
      ...props,
    },
    global: {
      stubs: {
        DiscussionAlbum: discussionAlbumStub,
        UsernameWithTooltip: usernameStub,
        MarkdownRenderer: markdownStub,
        TagComponent: tagStub,
        AddToDiscussionFavorites: favoriteStub,
        AvatarComponent: true,
        CommentIcon: true,
      },
    },
  });

describe('LibraryDiscussionCard', () => {
  it('renders the discussion title', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Best build ideas');
  });

  it('shows the sensitive badge when the discussion is flagged', () => {
    const wrapper = mountCard({
      discussion: {
        id: 'discussion-1',
        title: 'Best build ideas',
        body: 'A markdown body',
        createdAt: '2024-01-01T00:00:00Z',
        hasSensitiveContent: true,
        Tags: [],
        Album: null,
      },
    });

    expect(wrapper.text()).toContain('Sensitive');
  });

  it('renders the markdown body when present', () => {
    const wrapper = mountCard();

    expect(wrapper.findComponent(markdownStub).props('text')).toBe('A markdown body');
  });

  it('renders the async album section when images exist', () => {
    const wrapper = mountCard({
      discussion: {
        id: 'discussion-1',
        title: 'Best build ideas',
        body: 'A markdown body',
        createdAt: '2024-01-01T00:00:00Z',
        hasSensitiveContent: false,
        Tags: [],
        Album: { Images: [{ id: 'img-1' }] },
      },
    });

    expect(wrapper.find('.discussion-album-stub').exists()).toBe(true);
  });

  it('falls back to Deleted when the author is absent', () => {
    const wrapper = mountCard({ authorInfo: null });

    expect(wrapper.text()).toContain('Deleted');
  });

  it('passes the favorite button the discussion id', () => {
    const wrapper = mountCard();

    expect(wrapper.getComponent(favoriteStub).props('discussionId')).toBe('discussion-1');
  });

  it('caps visible tags at five entries', () => {
    const wrapper = mountCard({
      discussion: {
        id: 'discussion-1',
        title: 'Best build ideas',
        body: 'A markdown body',
        createdAt: '2024-01-01T00:00:00Z',
        hasSensitiveContent: false,
        Tags: [
          { text: 'a' },
          { text: 'b' },
          { text: 'c' },
          { text: 'd' },
          { text: 'e' },
          { text: 'f' },
        ],
        Album: null,
      },
    });

    expect(wrapper.findAll('.tag-stub')).toHaveLength(5);
  });
});
