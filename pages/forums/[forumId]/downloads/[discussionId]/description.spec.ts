import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import ErrorBanner from '@/components/ErrorBanner.vue';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';

const mutationError = vi.hoisted(
  () => ({ value: null as null | { message: string } })
);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { discussionId: 'd1' } }),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useMutation: () => ({
      mutate: vi.fn(),
      error: ref(mutationError.value),
      loading: ref(false),
      onDone: vi.fn(),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice') };
});

const discussion = {
  title: 'A download',
  body: 'Download body text',
  Author: { username: 'alice' },
};

const mountPage = async () => {
  const Page = (await import('./description.vue')).default;
  return shallowMount(Page, { props: { discussion: discussion as never } });
};

describe('download description tab', () => {
  beforeEach(() => {
    mutationError.value = null;
  });

  it('shows the edit button for the owner', async () => {
    const wrapper = await mountPage();
    expect(
      wrapper.find('[data-testid="edit-download-button"]').exists()
    ).toBe(true);
  });

  it('does not render title edit history on the description tab', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(DiscussionTitleVersions).exists()).toBe(false);
  });

  it('shows an error banner in edit mode when the update fails', async () => {
    mutationError.value = { message: 'Update failed' };
    const wrapper = await mountPage();

    await wrapper.find('[data-testid="edit-download-button"]').trigger('click');

    const banner = wrapper.findComponent(ErrorBanner);
    expect(banner.exists()).toBe(true);
    expect(banner.props('text')).toBe('Update failed');
  });
});
