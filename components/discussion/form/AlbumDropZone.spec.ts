import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import AlbumDropZone from '@/components/discussion/form/AlbumDropZone.vue';

const { usernameRef } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

const StripStub = {
  name: 'AlbumRecentUploadsStrip',
  props: ['selectedImageIds'],
  emits: ['add-image', 'browse'],
  template: '<div class="strip-stub" />',
};

const mountZone = (props: Record<string, unknown> = {}) =>
  mount(AlbumDropZone, {
    props: { isLimitReached: false, maxImages: 5, ...props },
    global: {
      stubs: {
        AlbumRecentUploadsStrip: StripStub,
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

const source = (w: ReturnType<typeof mount>, key: string) =>
  w.get(`[data-testid="album-source-${key}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  usernameRef.value = 'alice';
  vi.stubGlobal('alert', vi.fn());
});

describe('AlbumDropZone rendering', () => {
  it('shows the three sources with equal billing', () => {
    const wrapper = mountZone();

    expect(
      ['upload', 'library', 'link'].map((key) => source(wrapper, key).text())
    ).toEqual([
      'Upload filesChoose files or drag and drop',
      'From your libraryUploads, favorites, and collections',
      'Paste a linkUse an image from the web',
    ]);
  });

  it('shows the limit message when the limit is reached', () => {
    const wrapper = mountZone({ isLimitReached: true });

    expect(wrapper.text()).toContain('Maximum limit of 5 images reached');
  });

  it('hides the sources when the limit is reached', () => {
    const wrapper = mountZone({ isLimitReached: true });

    expect(wrapper.find('[data-testid="album-source-library"]').exists()).toBe(
      false
    );
  });

  it('keeps link and library actions available when file storage is unavailable', () => {
    const wrapper = mountZone({
      fileUploadAvailable: false,
      fileUploadUnavailableMessage: 'File storage is not configured.',
      setupUrl: '/admin/setup#file-uploads',
    });

    expect(
      ['upload', 'library', 'link'].map(
        (key) => source(wrapper, key).attributes('disabled') !== undefined
      )
    ).toEqual([true, false, false]);
  });

  it('links operators to upload setup when provided', () => {
    const wrapper = mountZone({
      fileUploadAvailable: false,
      fileUploadUnavailableMessage: 'File storage is not configured.',
      setupUrl: '/admin/setup#file-uploads',
    });

    expect(wrapper.get('a').attributes('href')).toBe(
      '/admin/setup#file-uploads'
    );
  });

  it('shows recent uploads and library shortcuts to signed-in users', () => {
    const wrapper = mountZone();

    expect({
      strip: wrapper.findComponent(StripStub).exists(),
      favorites: wrapper.find('[data-testid="album-browse-favorites"]').exists(),
      collections: wrapper
        .find('[data-testid="album-browse-collections"]')
        .exists(),
    }).toEqual({ strip: true, favorites: true, collections: true });
  });

  it('hides recent uploads and library shortcuts when signed out', () => {
    usernameRef.value = '';
    const wrapper = mountZone();

    expect(wrapper.findComponent(StripStub).exists()).toBe(false);
  });

  it('collapses to a compact "Add more" row once the album has images', () => {
    const wrapper = mountZone({ compact: true });

    expect({
      labels: ['upload', 'library', 'link'].map((key) =>
        source(wrapper, key).text()
      ),
      strip: wrapper.findComponent(StripStub).exists(),
    }).toEqual({ labels: ['Upload', 'Library', 'Link'], strip: false });
  });
});

describe('AlbumDropZone actions', () => {
  it('opens the file picker when Upload files is clicked', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');

    await source(wrapper, 'upload').trigger('click');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('emits files-selected when files are chosen', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'a.png')],
      configurable: true,
    });

    await input.trigger('change');

    expect(wrapper.emitted('files-selected')).toBeTruthy();
  });

  it('ignores a change event with no files', async () => {
    const wrapper = mountZone();
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });

    await input.trigger('change');

    expect(wrapper.emitted('files-selected')).toBeUndefined();
  });

  it('emits show-url-input from Paste a link', async () => {
    const wrapper = mountZone();

    await source(wrapper, 'link').trigger('click');

    expect(wrapper.emitted('show-url-input')).toBeTruthy();
  });

  it('emits show-existing-picker from From your library', async () => {
    const wrapper = mountZone();

    await source(wrapper, 'library').trigger('click');

    expect(wrapper.emitted('show-existing-picker')).toEqual([[undefined]]);
  });

  it.each([
    ['album-browse-favorites', 'favorites'],
    ['album-browse-collections', 'collections'],
  ])('opens the library on the right tab from %s', async (testid, tab) => {
    const wrapper = mountZone();

    await wrapper.get(`[data-testid="${testid}"]`).trigger('click');

    expect(wrapper.emitted('show-existing-picker')).toEqual([[tab]]);
  });

  it('opens the library from the recent uploads Browse all link', async () => {
    const wrapper = mountZone();

    wrapper.findComponent(StripStub).vm.$emit('browse');

    expect(wrapper.emitted('show-existing-picker')).toEqual([[undefined]]);
  });

  it('forwards a recent upload chosen in the strip', async () => {
    const wrapper = mountZone();
    const image = { id: 'img-1', url: 'https://img.test/1.jpg' };

    wrapper.findComponent(StripStub).vm.$emit('add-image', image);

    expect(wrapper.emitted('add-existing-image')).toEqual([[image]]);
  });

  it('emits drop when files are dropped', async () => {
    const wrapper = mountZone();

    await wrapper.find('.border-dotted').trigger('drop');

    expect(wrapper.emitted('drop')).toBeTruthy();
  });

  it('ignores dropped files when file uploads are unavailable', async () => {
    const wrapper = mountZone({ fileUploadAvailable: false });

    await wrapper.find('.border-dotted').trigger('drop');

    expect(wrapper.emitted('drop')).toBeUndefined();
  });

  it('handles dragover without emitting', async () => {
    const wrapper = mountZone();

    await wrapper.find('.border-dotted').trigger('dragover');

    expect(wrapper.emitted('drop')).toBeUndefined();
  });
});
