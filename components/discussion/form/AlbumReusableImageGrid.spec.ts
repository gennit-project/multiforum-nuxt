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
  LoadingSpinner: { template: '<div class="spinner" />' },
  ErrorBanner: { props: ['text'], template: '<div class="error">{{ text }}</div>' },
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

const addButtons = (wrapper: ReturnType<typeof mountGrid>) =>
  wrapper.findAll('[data-testid="reuse-image-add-button"]');

describe('AlbumReusableImageGrid', () => {
  it('renders one card per image', () => {
    const wrapper = mountGrid({ images: [image('a'), image('b')] });
    expect(wrapper.findAll('article')).toHaveLength(2);
  });

  it('shows the loading spinner while loading with no images yet', () => {
    const wrapper = mountGrid({ images: [], loading: true });
    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows the empty message when there are no images and not loading', () => {
    const wrapper = mountGrid({ images: [], emptyMessage: 'Nothing here.' });
    expect(wrapper.text()).toContain('Nothing here.');
  });

  it('renders the error banner when an error is passed', () => {
    const wrapper = mountGrid({ error: 'Boom' });
    expect(wrapper.find('.error').text()).toBe('Boom');
  });

  it('emits addImage with the image when Add to album is clicked', async () => {
    const wrapper = mountGrid({ images: [image('a')] });
    await addButtons(wrapper)[0].trigger('click');
    expect(wrapper.emitted('addImage')?.[0]?.[0]).toMatchObject({ id: 'a' });
  });

  it('disables and relabels the button for an already-selected image', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      selectedImageIds: ['a'],
    });
    expect({
      disabled: addButtons(wrapper)[0].attributes('disabled'),
      text: addButtons(wrapper)[0].text(),
    }).toEqual({ disabled: '', text: 'Already in album' });
  });

  it('disables and relabels the button when the album limit is reached', () => {
    const wrapper = mountGrid({
      images: [image('a')],
      isLimitReached: true,
    });
    expect({
      disabled: addButtons(wrapper)[0].attributes('disabled'),
      text: addButtons(wrapper)[0].text(),
    }).toEqual({ disabled: '', text: 'Album limit reached' });
  });
});
