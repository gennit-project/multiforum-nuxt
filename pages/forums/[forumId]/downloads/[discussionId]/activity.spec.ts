import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { discussionId: 'd1', forumId: 'cats' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: ref(null) }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const mountWith = async (discussion: Record<string, unknown>) => {
  const Page = (await import('./activity.vue')).default;
  return shallowMount(Page, { props: { discussion } });
};

describe('download activity page', () => {
  it('shows an empty-state message when there is no activity', async () => {
    const wrapper = await mountWith({
      PastTitleVersions: [],
      DiscussionChannels: [],
    });
    expect(wrapper.text()).toContain('No activity to display yet.');
  });

  it('renders the title-version history when the download has title edits', async () => {
    const wrapper = await mountWith({
      PastTitleVersions: [{ id: 't1' }],
      DiscussionChannels: [],
    });
    expect(wrapper.findComponent(DiscussionTitleVersions).exists()).toBe(true);
  });
});
