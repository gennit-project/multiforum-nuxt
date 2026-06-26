import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AlbumThumbnailGrid from './AlbumThumbnailGrid.vue';

const img = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  url: `${id}.png`,
  Uploader: { username: 'alice' },
  ...extra,
});

const mountGrid = (props: Record<string, unknown>) =>
  mount(AlbumThumbnailGrid, {
    props,
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  });

describe('AlbumThumbnailGrid', () => {
  it('shows the empty message when there are no images', () => {
    expect(mountGrid({ images: [] }).text()).toContain(
      'No images in this album.'
    );
  });

  it('renders a tile per image', () => {
    expect(
      mountGrid({ images: [img('a'), img('b')] }).findAll('img')
    ).toHaveLength(2);
  });

  it('caps the number of tiles at maxImages', () => {
    expect(
      mountGrid({ images: [img('a'), img('b'), img('c')], maxImages: 2 }).findAll(
        'img'
      )
    ).toHaveLength(2);
  });

  it('renders the caption when captions are enabled', () => {
    expect(
      mountGrid({ images: [img('a', { caption: 'Sunset' })] }).text()
    ).toContain('Sunset');
  });

  it('hides captions when showCaptions is false', () => {
    expect(
      mountGrid({
        images: [img('a', { caption: 'Sunset' })],
        showCaptions: false,
      }).text()
    ).not.toContain('Sunset');
  });
});
