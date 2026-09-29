import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumRecentUploadsStrip from '@/components/discussion/form/AlbumRecentUploadsStrip.vue';

const { usernameRef, mockResult } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
  mockResult: { value: null as unknown },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: mockResult }),
}));

const image = (id: string) => ({
  id,
  url: `https://img.test/${id}.jpg`,
  alt: `alt-${id}`,
});

const withImages = (images: unknown[]) => {
  mockResult.value = { users: [{ Images: images }] };
};

const mountStrip = (selectedImageIds: string[] = []) =>
  mountWithDefaults(AlbumRecentUploadsStrip, {
    props: { selectedImageIds },
  });

const thumbs = (wrapper: ReturnType<typeof mountStrip>) =>
  wrapper.findAll('[data-testid="album-recent-upload"]');

beforeEach(() => {
  mockResult.value = ref(null).value;
  usernameRef.value = 'alice';
});

describe('AlbumRecentUploadsStrip', () => {
  it('renders nothing when the user has no uploads', () => {
    const wrapper = mountStrip();
    expect(wrapper.find('[data-testid="album-recent-uploads"]').exists()).toBe(
      false
    );
  });

  it('renders a thumbnail per recent upload', () => {
    withImages([image('a'), image('b')]);
    expect(thumbs(mountStrip())).toHaveLength(2);
  });

  it('emits addImage with the image when a thumbnail is clicked', async () => {
    withImages([image('a')]);
    const wrapper = mountStrip();
    await thumbs(wrapper)[0].trigger('click');
    expect(wrapper.emitted('addImage')?.[0]?.[0]).toMatchObject({ id: 'a' });
  });

  it('disables a thumbnail that is already in the album', () => {
    withImages([image('a')]);
    expect(thumbs(mountStrip(['a']))[0].attributes('disabled')).toBeDefined();
  });

  it('emits browse from the Browse all link', async () => {
    withImages([image('a')]);
    const wrapper = mountStrip();
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Browse all')!
      .trigger('click');
    expect(wrapper.emitted('browse')).toHaveLength(1);
  });
});
