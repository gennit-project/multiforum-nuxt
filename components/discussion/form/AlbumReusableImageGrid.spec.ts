import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumReusableImageGrid from '@/components/discussion/form/AlbumReusableImageGrid.vue';

const image = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  url: `https://img.test/${id}.jpg`,
  alt: `alt-${id}`,
  caption: `caption-${id}`,
  Uploader: { username: 'alice', displayName: 'Alice' },
  ...extra,
});

const stubs = {
  ErrorBanner: {
    props: ['text'],
    template: '<div class="error">{{ text }}</div>',
  },
  ImageCaption: {
    name: 'ImageCaption',
    props: ['text'],
    template: '<div>{{ text }}</div>',
  },
};

const mountGrid = (props: Record<string, unknown>) =>
  mountWithDefaults(AlbumReusableImageGrid, {
    props: {
      images: [],
      selectedImageIds: [],
      isLimitReached: false,
      loading: false,
      ...props,
    },
    global: { stubs },
  });

const toggles = (wrapper: ReturnType<typeof mountGrid>) =>
  wrapper.findAll('[data-testid="reuse-image-toggle"]');

describe('AlbumReusableImageGrid', () => {
  it('renders one card per image', () => {
    const wrapper = mountGrid({ images: [image('a'), image('b')] });
    expect(wrapper.findAll('img')[0]?.attributes()).toMatchObject({
      src: 'https://img.test/a.jpg',
      width: '160',
      height: '160',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  it('shows image-card skeletons while loading with no images yet', () => {
    const wrapper = mountGrid({ images: [], loading: true });
    expect(
      wrapper
        .get('[data-testid="reusable-image-skeleton-grid"]')
        .findAll('li')
    ).toHaveLength(8);
  });

  it('announces the image loading state', () => {
    expect(
      mountGrid({ images: [], loading: true })
        .get('[role="status"]')
        .attributes('aria-label')
    ).toBe('Loading images');
  });

  it('shows the empty message when there are no images and not loading', () => {
    const wrapper = mountGrid({ images: [], emptyMessage: 'Nothing here.' });
    expect(wrapper.text()).toContain('Nothing here.');
  });

  it('renders the error banner when an error is passed', () => {
    const wrapper = mountGrid({ error: 'Boom' });
    expect(wrapper.find('.error').text()).toBe('Boom');
  });

  it('passes captions to the Markdown caption renderer', () => {
    const wrapper = mountGrid({
      images: [image('a', { caption: '[Example](https://example.com)' })],
    });

    expect(wrapper.getComponent({ name: 'ImageCaption' }).props('text')).toBe(
      '[Example](https://example.com)'
    );
  });

  it('emits toggleImage with the image when its tile is clicked', async () => {
    const wrapper = mountGrid({ images: [image('a')] });
    await toggles(wrapper)[0].trigger('click');
    expect(wrapper.emitted('toggleImage')?.[0]?.[0]).toMatchObject({ id: 'a' });
  });

  it('marks a picked image as pressed', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      pendingImageIds: ['a'],
    });
    expect(toggles(wrapper)[0].attributes('aria-pressed')).toBe('true');
  });

  it('leaves an unpicked image unpressed', () => {
    const wrapper = mountGrid({ images: [image('a')] });
    expect(toggles(wrapper)[0].attributes('aria-pressed')).toBe('false');
  });

  it('disables and labels an image that is already in the album', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      selectedImageIds: ['a'],
    });
    expect({
      disabled: toggles(wrapper)[0].attributes('disabled'),
      text: toggles(wrapper)[0].text(),
    }).toEqual({ disabled: '', text: 'Already in album' });
  });

  it('disables unpicked images once the album limit is reached', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      isLimitReached: true,
    });
    expect({
      disabled: toggles(wrapper)[0].attributes('disabled'),
      text: toggles(wrapper)[0].text(),
    }).toEqual({ disabled: '', text: 'Album limit reached' });
  });

  it('keeps picked images toggleable at the album limit so they can be unpicked', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      pendingImageIds: ['a'],
      isLimitReached: true,
    });
    expect(toggles(wrapper)[0].attributes('disabled')).toBeUndefined();
  });
});
