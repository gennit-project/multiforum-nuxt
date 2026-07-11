import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import LibraryCommentCard from '@/components/library/LibraryCommentCard.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const usernameStub = defineComponent({
  name: 'UsernameWithTooltip',
  props: ['username', 'displayName'],
  template: '<div>{{ displayName || username }}</div>',
});

const markdownStub = defineComponent({
  name: 'MarkdownPreview',
  props: ['text', 'disableGallery'],
  template: '<div>{{ text }}</div>',
});

const favoriteStub = defineComponent({
  name: 'AddToCommentFavorites',
  props: ['allowAddToList', 'commentId', 'isFavorited', 'size'],
  template: '<div class="favorite-stub" />',
});

const mountCard = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LibraryCommentCard, {
    props: {
      comment: {
        id: 'comment-1',
        text: 'A useful comment',
        createdAt: '2024-01-01T00:00:00Z',
      },
      authorInfo: {
        username: 'alice',
        displayName: 'Alice',
        profilePicURL: '',
        commentKarma: 1,
        discussionKarma: 2,
        createdAt: '2023-01-01T00:00:00Z',
        isAdmin: false,
        isModerationProfile: false,
      },
      contextType: 'Discussion',
      contextTitle: 'Best build ideas',
      contextPermalink: '/discussions/1',
      permalink: '/discussions/1/comments/1',
      showFavoriteButton: false,
      allowAddToList: false,
      isFavorited: true,
      ...props,
    },
    global: {
      stubs: {
        UsernameWithTooltip: usernameStub,
        MarkdownPreview: markdownStub,
        AddToCommentFavorites: favoriteStub,
        AvatarComponent: true,
        ArrowUpRightIcon: true,
        EllipsisHorizontal: true,
      },
    },
  });

describe('LibraryCommentCard', () => {
  it('renders the markdown preview with the comment text', () => {
    const wrapper = mountCard();

    expect(wrapper.getComponent(markdownStub).props('text')).toBe('A useful comment');
  });

  it('renders the discussion context title', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Best build ideas');
  });

  it('shows the moderator label for moderation profiles', () => {
    const wrapper = mountCard({
      authorInfo: {
        username: 'mod-profile',
        displayName: 'Forum Mod',
        profilePicURL: '',
        commentKarma: 1,
        discussionKarma: 2,
        createdAt: '2023-01-01T00:00:00Z',
        isAdmin: false,
        isModerationProfile: true,
      },
    });

    expect(wrapper.text()).toContain('Forum Mod (Moderator)');
  });

  it('falls back to Deleted when the author is absent', () => {
    const wrapper = mountCard({ authorInfo: null });

    expect(wrapper.text()).toContain('Deleted');
  });

  it('passes the favorite button the comment id when enabled', () => {
    const wrapper = mountCard({ showFavoriteButton: true });

    expect(wrapper.getComponent(favoriteStub).props('commentId')).toBe('comment-1');
  });
});
