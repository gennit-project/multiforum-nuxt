import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import PhotoAvatar from '@/components/user/PhotoAvatar.vue';

const h = vi.hoisted(() => ({
  result: null as unknown as { value: any },
  loading: null as unknown as { value: boolean },
  error: null as unknown as { value: any },
}));

h.result = ref({ theme: 'dark' });
h.loading = ref(false);
h.error = ref(null);

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    loading: h.loading,
    error: h.error,
  }),
}));

describe('PhotoAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.result.value = { theme: 'dark' };
    h.loading.value = false;
    h.error.value = null;
  });

  it('renders the image src and alt text', () => {
    const wrapper = mount(PhotoAvatar, {
      props: {
        src: 'https://example.test/avatar.png',
        alt: 'Alice avatar',
      },
    });

    expect({
      src: wrapper.get('img').attributes('src'),
      alt: wrapper.get('img').attributes('alt'),
    }).toEqual({
      src: 'https://example.test/avatar.png',
      alt: 'Alice avatar',
    });
  });

  it('uses round styling by default with the standard size classes', () => {
    const wrapper = mount(PhotoAvatar, {
      props: {
        src: 'https://example.test/avatar.png',
        alt: 'Alice avatar',
      },
    });

    expect(wrapper.get('img').classes()).toEqual(
      expect.arrayContaining(['h-8', 'w-8', 'rounded-full'])
    );
  });

  it('uses square styling and omits the default size classes when large', () => {
    const wrapper = mount(PhotoAvatar, {
      props: {
        src: 'https://example.test/avatar.png',
        alt: 'Alice avatar',
        isSquare: true,
        isLarge: true,
      },
    });

    expect({
      hasSquare: wrapper.get('img').classes().includes('rounded-lg'),
      hasSmallHeight: wrapper.get('img').classes().includes('h-8'),
      hasSmallWidth: wrapper.get('img').classes().includes('w-8'),
    }).toEqual({
      hasSquare: true,
      hasSmallHeight: false,
      hasSmallWidth: false,
    });
  });
});
