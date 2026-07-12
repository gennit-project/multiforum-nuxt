import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { createPinia, setActivePinia } from 'pinia';

vi.stubGlobal('definePageMeta', vi.fn());

const h = vi.hoisted(() => ({
  username: null as unknown as { value: string },
  updateImage: vi.fn(),
  useHead: vi.fn(),
  routeParams: { username: 'alice', imageId: 'img1' },
  isLightboxOpen: null as unknown as { value: boolean },
  closeLightbox: vi.fn(),
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
  useMutation: () => ({
    mutate: h.updateImage,
    loading: ref(false),
    onDone: vi.fn(),
  }),
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

const mountWith = async (
  image: unknown,
  options: { loading?: boolean; error?: unknown } = {}
) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ images: image ? [image] : [] }),
    error: ref(options.error ?? null),
    loading: ref(options.loading ?? false),
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
});

describe('user image detail page', () => {
  it('shows the loading state', async () => {
    expect((await mountWith(null, { loading: true })).text()).toContain('Loading image...');
  });

  it('shows the not-found state when the image query fails', async () => {
    expect((await mountWith(null, { error: { message: 'boom' } })).text()).toContain('Image Not Found');
  });

  it('shows the invalid-url state when the image belongs to another uploader', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      Uploader: { username: 'bob' },
      Album: { Images: [], imageOrder: [] },
    });
    expect(wrapper.text()).toContain('This image was uploaded by bob, not alice.');
  });

  it('renders the image with its url', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      caption: 'A photo',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });
    expect(wrapper.find('img').attributes('src')).toBe('https://img.test/photo.jpg');
  });

  it('saves an updated caption for the uploader', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      caption: 'Old caption',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });

    await wrapper.findAll('button').find((node) => node.text().includes('Edit'))?.trigger('click');
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit('update', 'New caption');
    await wrapper.findComponent({ name: 'SaveButton' }).vm.$emit('click');

    expect(h.updateImage).toHaveBeenCalledWith({
      imageId: 'img1',
      caption: 'New caption',
    });
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
      closeControl: wrapper
        .get('[aria-label="Close image lightbox"]')
        .element.tagName,
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
