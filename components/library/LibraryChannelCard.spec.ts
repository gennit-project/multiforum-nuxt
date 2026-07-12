import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import LibraryChannelCard from '@/components/library/LibraryChannelCard.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const imageStub = defineComponent({
  name: 'ExpandableImage',
  props: ['src', 'alt', 'rounded'],
  template: '<div class="image-stub" />',
});

const tagStub = defineComponent({
  name: 'TagComponent',
  props: ['tag'],
  template: '<div class="tag-stub">{{ tag }}</div>',
});

const favoriteStub = defineComponent({
  name: 'AddToChannelFavorites',
  props: [
    'allowAddToList',
    'channelUniqueName',
    'channelDisplayName',
    'initialIsFavorited',
    'size',
  ],
  template: '<div class="favorite-stub" />',
});

const mountCard = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LibraryChannelCard, {
    props: {
      channel: {
        uniqueName: 'sims4',
        displayName: 'Sims 4 Builds',
        description: 'Sharing lots and builds.',
        channelIconURL: null,
        Tags: [{ text: 'builds' }, { text: 'cc' }],
      },
      showFavoriteButton: false,
      allowAddToList: false,
      isFavorited: false,
      ...props,
    },
    global: {
      stubs: {
        ExpandableImage: imageStub,
        TagComponent: tagStub,
        AddToChannelFavorites: favoriteStub,
        AvatarComponent: true,
      },
    },
  });

describe('LibraryChannelCard', () => {
  it('renders the channel display name', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Sims 4 Builds');
  });

  it('renders the channel description when present', () => {
    const wrapper = mountCard();

    expect(wrapper.text()).toContain('Sharing lots and builds.');
  });

  it('renders the icon image when a channel icon url exists', () => {
    const wrapper = mountCard({
      channel: {
        uniqueName: 'sims4',
        displayName: 'Sims 4 Builds',
        description: 'Sharing lots and builds.',
        channelIconURL: 'https://example.com/icon.png',
        Tags: [],
      },
    });

    expect(wrapper.find('.image-stub').exists()).toBe(true);
  });

  it('passes the channel unique name to the favorite button', () => {
    const wrapper = mountCard({ showFavoriteButton: true });

    expect(wrapper.getComponent(favoriteStub).props('channelUniqueName')).toBe('sims4');
  });

  it('shows a +more indicator when more than four tags exist', () => {
    const wrapper = mountCard({
      channel: {
        uniqueName: 'sims4',
        displayName: 'Sims 4 Builds',
        description: 'Sharing lots and builds.',
        channelIconURL: null,
        Tags: [
          { text: 'a' },
          { text: 'b' },
          { text: 'c' },
          { text: 'd' },
          { text: 'e' },
        ],
      },
    });

    expect(wrapper.text()).toContain('+1 more');
  });
});
