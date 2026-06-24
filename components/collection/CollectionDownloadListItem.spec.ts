import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import CollectionDownloadListItem from '@/components/collection/CollectionDownloadListItem.vue';
import type { Discussion } from '@/__generated__/graphql';

const discussion = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'd1',
    title: 'A model',
    createdAt: '2024-01-01T00:00:00Z',
    DiscussionChannels: [{ channelUniqueName: 'cats' }],
    Album: { Images: [{ id: 'i1', url: 'https://x/a.png' }] },
    ...overrides,
  }) as unknown as Partial<Discussion>;

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(CollectionDownloadListItem, {
    props: { discussion: discussion(), ...props },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('CollectionDownloadListItem content', () => {
  it('shows the title', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('A model');
  });

  it('falls back to an untitled label', () => {
    const wrapper = mountItem({ discussion: discussion({ title: '' }) });

    expect(wrapper.text()).toContain('Untitled download');
  });

  it('shows the forum name', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('cats');
  });

  it('falls back to Unknown forum', () => {
    const wrapper = mountItem({ discussion: discussion({ DiscussionChannels: [] }) });

    expect(wrapper.text()).toContain('Unknown forum');
  });

  it('shows the created-ago time', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('ago');
  });
});

describe('CollectionDownloadListItem preview image', () => {
  it('shows the first album image', () => {
    const wrapper = mountItem();

    expect(wrapper.find('img').attributes('src')).toBe('https://x/a.png');
  });

  it('respects the album image order', () => {
    const wrapper = mountItem({
      discussion: discussion({
        Album: {
          Images: [
            { id: 'i1', url: 'https://x/a.png' },
            { id: 'i2', url: 'https://x/b.png' },
          ],
          imageOrder: ['i2', 'i1'],
        },
      }),
    });

    expect(wrapper.find('img').attributes('src')).toBe('https://x/b.png');
  });

  it('shows a no-preview placeholder without images', () => {
    const wrapper = mountItem({ discussion: discussion({ Album: { Images: [] } }) });

    expect(wrapper.text()).toContain('No preview');
  });
});
