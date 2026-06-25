import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import EventCoverImageField from './EventCoverImageField.vue';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

const mountField = (imageUrl: string | null) =>
  shallowMount(EventCoverImageField, { props: { imageUrl } });

describe('EventCoverImageField', () => {
  it('renders the cover image when a url is provided', () => {
    const wrapper = mountField('https://img.test/cover.png');
    expect(wrapper.get('img').attributes('src')).toBe(
      'https://img.test/cover.png'
    );
  });

  it('shows the empty state when there is no image', () => {
    expect(mountField('').text()).toContain('No cover image uploaded');
  });

  it('emits an empty url when the image is removed', async () => {
    const wrapper = mountField('https://img.test/cover.png');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update')?.[0]).toEqual(['']);
  });
});
