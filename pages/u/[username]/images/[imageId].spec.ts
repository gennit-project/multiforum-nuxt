import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { createPinia, setActivePinia } from 'pinia';

vi.stubGlobal('definePageMeta', vi.fn());

const h = vi.hoisted(() => ({
  username: null as unknown as { value: string },
  updateImage: vi.fn(),
  useHead: vi.fn(),
  routeParams: { username: 'alice', imageId: 'img1' },
  isLightboxOpen: null as unknown as { value: boolean },
  closeLightbox: vi.fn(),
  addImageToAlbum: vi.fn(),
  refetchAlbumUsage: vi.fn(),
  refetchUserAlbums: vi.fn(),
  updateDone: null as null | (() => void),
}));

h.username = ref('alice');
h.isLightboxOpen = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: h.routeParams }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: h.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Multiforum' },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));

vi.mock('@/composables/useCopyCurrentUrl', () => ({
  useCopyCurrentUrl: () => ({
    showCopiedNotification: ref(false),
    copyCurrentUrl: vi.fn(),
  }),
}));

vi.mock('@/composables/useImageZoomPan', () => ({
  useImageZoomPan: () => ({
    isLightboxOpen: h.isLightboxOpen,
    zoomLevel: ref(1),
    isZoomed: ref(false),
    isDragging: ref(false),
    translateX: ref(0),
    translateY: ref(0),
    startDrag: vi.fn(),
    onDrag: vi.fn(),
    stopDrag: vi.fn(),
    openLightbox: vi.fn(),
    closeLightbox: h.closeLightbox,
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
    handleKeyDown: vi.fn(),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

const baseImage = {
  id: 'img1',
  url: 'https://img.test/photo.jpg',
  caption: 'A photo',
  Uploader: { username: 'alice' },
  Album: { Images: [], imageOrder: [] },
};

const mountWith = async (
  image: unknown,
  options: {
    loading?: boolean;
    error?: unknown;
    albumUsage?: unknown;
    userAlbums?: unknown[];
    userAlbumsLoading?: boolean;
  } = {}
) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ images: image ? [image] : [] }),
      error: ref(options.error ?? null),
      loading: ref(options.loading ?? false),
    })
    .mockReturnValueOnce({
      result: ref({ getImageAlbumUsage: options.albumUsage ?? null }),
      refetch: h.refetchAlbumUsage,
    })
    .mockReturnValueOnce({
      result: ref({ albums: options.userAlbums ?? [] }),
      loading: ref(options.userAlbumsLoading ?? false),
      refetch: h.refetchUserAlbums,
    });
  mockedUseMutation
    .mockReturnValueOnce({
      mutate: h.addImageToAlbum,
      loading: ref(false),
    })
    .mockReturnValueOnce({
      mutate: h.updateImage,
      loading: ref(false),
      onDone: (callback: () => void) => {
        h.updateDone = callback;
      },
    });
  const Page = (await import('./[imageId].vue')).default;
  return shallowMount(Page);
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  h.username.value = 'alice';
  h.routeParams = { username: 'alice', imageId: 'img1' };
  h.isLightboxOpen = ref(false);
  h.updateDone = null;
  h.updateImage.mockResolvedValue(undefined);
  h.addImageToAlbum.mockResolvedValue(undefined);
  h.refetchAlbumUsage.mockResolvedValue(undefined);
  h.refetchUserAlbums.mockResolvedValue(undefined);
});

describe('user image detail page', () => {
  it('shows the loading state', async () => {
    expect((await mountWith(null, { loading: true })).text()).toContain(
      'Loading image...'
    );
  });

  it('shows the not-found state when the image query fails', async () => {
    expect(
      (await mountWith(null, { error: { message: 'boom' } })).text()
    ).toContain('Image Not Found');
  });

  it('shows the invalid-url state when the image belongs to another uploader', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      Uploader: { username: 'bob' },
      Album: { Images: [], imageOrder: [] },
    });
    expect(wrapper.text()).toContain(
      'This image was uploaded by bob, not alice.'
    );
  });

  it('renders the image with its url', async () => {
    const wrapper = await mountWith(baseImage);
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://img.test/photo.jpg'
    );
  });

  it('saves an updated caption for the uploader', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      caption: 'Old caption',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });

    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Edit'))
      ?.trigger('click');
    await wrapper
      .findComponent({ name: 'TextEditor' })
      .vm.$emit('update', 'New caption');
    await wrapper.findComponent({ name: 'SaveButton' }).vm.$emit('click');

    expect(h.updateImage).toHaveBeenCalledWith({
      imageId: 'img1',
      caption: 'New caption',
    });
  });

  it('saves updated alt text for the uploader', async () => {
    const wrapper = await mountWith({ ...baseImage, alt: 'Old alt text' });

    await wrapper
      .findAll('button')
      .find(
        (node) =>
          node.text().includes('Edit') &&
          node.element.parentElement?.textContent?.includes('Alt Text')
      )
      ?.trigger('click');
    await wrapper.get('textarea').setValue('New alt text');
    await wrapper
      .findAllComponents({ name: 'SaveButton' })
      .at(-1)
      ?.vm.$emit('click');

    expect(h.updateImage).toHaveBeenCalledWith({
      imageId: 'img1',
      alt: 'New alt text',
    });
  });

  it('clears the active editor after an update completes', async () => {
    const wrapper = await mountWith(baseImage);
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Edit'))
      ?.trigger('click');

    h.updateDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(false);
  });

  it('opens the album picker and refreshes the album list', async () => {
    const wrapper = await mountWith(baseImage);

    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');

    expect({
      dialog: wrapper.find('[aria-labelledby="save-to-album-title"]').exists(),
      refreshed: h.refetchUserAlbums.mock.calls.length,
    }).toEqual({ dialog: true, refreshed: 1 });
  });

  it('shows the empty album state', async () => {
    const wrapper = await mountWith(baseImage, { userAlbums: [] });
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');

    expect(wrapper.text()).toContain('You do not have any albums yet.');
  });

  it('marks albums that already contain the image as saved', async () => {
    const album = { id: 'album-1', Owner: { username: 'alice' } };
    const wrapper = await mountWith(baseImage, {
      albumUsage: { uploaderOwnedAlbums: [album], otherAlbums: [] },
      userAlbums: [{ ...album, ImagesAggregate: { count: 1 } }],
    });
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');
    const albumButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Already saved'));

    expect(albumButton?.attributes('disabled')).toBeDefined();
  });

  it('saves the image to a new album', async () => {
    const wrapper = await mountWith(baseImage, {
      userAlbums: [{ id: 'album-2', Discussions: [{ title: 'Favorites' }] }],
    });
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Favorites'))
      ?.trigger('click');

    expect({
      mutation: h.addImageToAlbum.mock.calls[0]?.[0],
      usageRefreshes: h.refetchAlbumUsage.mock.calls.length,
      albumRefreshes: h.refetchUserAlbums.mock.calls.length,
    }).toEqual({
      mutation: { albumId: 'album-2', imageId: 'img1' },
      usageRefreshes: 1,
      albumRefreshes: 2,
    });
  });

  it('surfaces an album save failure', async () => {
    h.addImageToAlbum.mockRejectedValueOnce(new Error('Album unavailable'));
    const wrapper = await mountWith(baseImage, {
      userAlbums: [{ id: 'album-2' }],
    });
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Album album-2'))
      ?.trigger('click');

    expect(wrapper.text()).toContain('Album unavailable');
  });

  it('shows a generic message for a non-Error album failure', async () => {
    h.addImageToAlbum.mockRejectedValueOnce('unavailable');
    const wrapper = await mountWith(baseImage, {
      userAlbums: [{ id: 'album-2' }],
    });
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to album'))
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Album album-2'))
      ?.trigger('click');

    expect(wrapper.text()).toContain('Could not save image to album.');
  });

  it('reports a caption save failure', async () => {
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);
    h.updateImage.mockRejectedValueOnce(new Error('Offline'));
    const wrapper = await mountWith(baseImage);
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Edit'))
      ?.trigger('click');
    await wrapper.findComponent({ name: 'SaveButton' }).vm.$emit('click');

    expect(alert).toHaveBeenCalledWith(
      'Error saving caption. Please try again.'
    );
  });

  it('reports an alt-text save failure', async () => {
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);
    h.updateImage.mockRejectedValueOnce(new Error('Offline'));
    const wrapper = await mountWith({ ...baseImage, alt: 'Description' });
    await wrapper
      .findAll('button')
      .find(
        (node) =>
          node.text().includes('Edit') &&
          node.element.parentElement?.textContent?.includes('Alt Text')
      )
      ?.trigger('click');
    await wrapper
      .findAllComponents({ name: 'SaveButton' })
      .at(-1)
      ?.vm.$emit('click');

    expect(alert).toHaveBeenCalledWith(
      'Error saving alt text. Please try again.'
    );
  });

  it('downloads the displayed image through a temporary object URL', async () => {
    vi.useFakeTimers();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const blob = new Blob(['image']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: () => blob }));
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:image'),
      revokeObjectURL: vi.fn(),
    });
    const wrapper = await mountWith(baseImage);
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Download'))
      ?.trigger('click');
    await Promise.resolve();
    await Promise.resolve();
    vi.runAllTimers();

    expect(click).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('sets descriptive metadata for an image', async () => {
    await mountWith({
      ...baseImage,
      alt: 'A tabby cat',
      longDescription: 'Sitting by a window',
      Uploader: { username: 'alice', displayName: 'Alice' },
    });

    expect(h.useHead).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'A photo by Alice | Multiforum' })
    );
  });

  it('opens and closes the collection picker', async () => {
    const wrapper = await mountWith(baseImage);
    await wrapper
      .findAll('button')
      .find((node) => node.text().includes('Save to collection'))
      ?.trigger('click');
    const picker = wrapper.findComponent({ name: 'AddToListPopover' });
    picker.vm.$emit('close');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'AddToListPopover' }).exists()).toBe(
      false
    );
  });

  it('renders ordered sibling images from the uploader album', async () => {
    const wrapper = await mountWith(
      {
        ...baseImage,
        Albums: [
          {
            id: 'album-1',
            Owner: { username: 'alice' },
            imageOrder: ['img2', 'img1'],
            Images: [
              baseImage,
              { id: 'img2', url: 'https://img.test/two.jpg' },
            ],
          },
        ],
      },
      {
        albumUsage: {
          uploaderOwnedAlbums: [
            { id: 'album-1', Owner: { username: 'alice' } },
          ],
          otherAlbums: [],
        },
      }
    );

    expect(
      wrapper.findComponent({ name: 'AlbumThumbnailGrid' }).props('images')
    ).toEqual([{ id: 'img2', url: 'https://img.test/two.jpg' }]);
  });

  it.each([
    ['https://img.test/model.glb', 'ModelViewer'],
    ['https://img.test/model.stl', 'StlViewer'],
  ])('renders %s with the specialized viewer', async (url, componentName) => {
    const wrapper = await mountWith({ ...baseImage, url });

    expect(wrapper.findComponent({ name: componentName }).exists()).toBe(true);
  });

  it('exposes the open lightbox as a named modal dialog', async () => {
    h.isLightboxOpen.value = true;
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      caption: 'A photo',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });
    const dialog = wrapper.get('[role="dialog"]');

    expect({
      modal: dialog.attributes('aria-modal'),
      label: dialog.attributes('aria-label'),
      closeControl: wrapper.get('[aria-label="Close image lightbox"]').element
        .tagName,
    }).toEqual({
      modal: 'true',
      label: 'Image lightbox',
      closeControl: 'BUTTON',
    });
    wrapper.unmount();
  });

  it('closes the lightbox on Escape', async () => {
    h.isLightboxOpen.value = true;
    await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(h.closeLightbox).toHaveBeenCalledOnce();
  });
});
