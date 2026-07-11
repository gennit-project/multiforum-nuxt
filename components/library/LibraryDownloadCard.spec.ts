import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import LibraryDownloadCard from '@/components/library/LibraryDownloadCard.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const usernameStub = defineComponent({
  name: 'UsernameWithTooltip',
  props: ['username', 'displayName'],
  template: '<div>{{ displayName || username }}</div>',
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
  mountWithDefaults(LibraryDownloadCard, {
    props: {
      download: {
        id: 'download-1',
        title: 'Modern villa set',
        createdAt: '2024-01-01T00:00:00Z',
        Tags: [{ text: 'residential' }, { text: 'cc' }],
      },
      downloadLink: '/downloads/1',
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
      previewImageUrl: '',
      showFavoriteButton: true,
      allowAddToList: false,
      isFavorited: false,
      ...props,
    },
    global: {
      stubs: {
        UsernameWithTooltip: usernameStub,
        TagComponent: tagStub,
        AddToDiscussionFavorites: favoriteStub,
        AvatarComponent: true,
      },
    },
  });

describe('LibraryDownloadCard', () => {
  it('renders the download title', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Modern villa set');
  });

  it('renders a preview image when one is provided', () => {
    const wrapper = mountCard({ previewImageUrl: 'https://example.com/preview.jpg' });

    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/preview.jpg');
  });

  it('shows the empty preview fallback when no image is provided', () => {
    const wrapper = mountCard({ previewImageUrl: '' });

    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('falls back to Deleted when the author is absent', () => {
    const wrapper = mountCard({ authorInfo: null });

    expect(wrapper.text()).toContain('Deleted');
  });

  it('passes Download as the favorite entity name', () => {
    const wrapper = mountCard();

    expect(wrapper.getComponent(favoriteStub).props('entityName')).toBe('Download');
  });

  it('caps visible tags at four entries', () => {
    const wrapper = mountCard({
      download: {
        id: 'download-1',
        title: 'Modern villa set',
        createdAt: '2024-01-01T00:00:00Z',
        Tags: [
          { text: 'a' },
          { text: 'b' },
          { text: 'c' },
          { text: 'd' },
          { text: 'e' },
        ],
      },
    });

    expect(wrapper.findAll('.tag-stub')).toHaveLength(4);
  });
});
