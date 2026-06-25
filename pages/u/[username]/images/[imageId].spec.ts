import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.stubGlobal('definePageMeta', vi.fn());

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice', imageId: 'img1' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), loading: ref(false), onDone: vi.fn() }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useImageZoomPan', () => ({
  useImageZoomPan: () => ({
    isLightboxOpen: ref(false),
    zoomLevel: ref(1),
    isZoomed: ref(false),
    isDragging: ref(false),
    translateX: ref(0),
    translateY: ref(0),
    startDrag: vi.fn(),
    onDrag: vi.fn(),
    stopDrag: vi.fn(),
    openLightbox: vi.fn(),
    closeLightbox: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
    handleKeyDown: vi.fn(),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (image: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ images: image ? [image] : [] }),
    error: ref(null),
    loading: ref(false),
  });
  const Page = (await import('./[imageId].vue')).default;
  return shallowMount(Page);
};

describe('user image detail page', () => {
  it('renders the image with its url', async () => {
    const wrapper = await mountWith({
      id: 'img1',
      url: 'https://img.test/photo.jpg',
      caption: 'A photo',
      Uploader: { username: 'alice' },
      Album: { Images: [], imageOrder: [] },
    });
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://img.test/photo.jpg'
    );
  });
});
