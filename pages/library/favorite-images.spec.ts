import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h as createEl } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import FavoriteImagesPage from './favorite-images.vue';

const h = vi.hoisted(() => ({
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
}));

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice') };
});

const stubs = {
  ImageListItem: { name: 'ImageListItem', props: ['image', 'username'], template: '<div class="image-item" />' },
};

// RequireAuth stub that renders the unauthenticated slot, for the signed-out case.
const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_p, { slots }) {
    return () => createEl('div', slots['does-not-have-auth']?.());
  },
});

const mountPage = (extraStubs: Record<string, unknown> = {}) =>
  mountWithDefaults(FavoriteImagesPage, {
    global: { stubs: { ...stubs, ...extraStubs } },
  });

const setImages = (images: unknown[]) => {
  h.resultRef.value = { users: [{ username: 'alice', FavoriteImages: images }] };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
});

describe('Favorite images page', () => {
  it('shows the loading state', () => {
    h.loadingRef.value = true;
    expect(mountPage().text()).toContain('Loading your favorite images');
  });

  it('shows the error state', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountPage().text()).toContain('Error loading favorite images: boom');
  });

  it('shows the empty state when there are no favorites', () => {
    setImages([]);
    expect(mountPage().text()).toContain('No favorite images yet');
  });

  it('renders an ImageListItem per favorite image', () => {
    setImages([{ id: 'i1' }, { id: 'i2' }]);
    expect(mountPage().findAllComponents({ name: 'ImageListItem' })).toHaveLength(2);
  });

  it('prompts unauthenticated users to sign in', () => {
    const wrapper = mountPage({ RequireAuth: RequireAuthUnauth });
    expect(wrapper.text()).toContain('Sign In Required');
  });
});
