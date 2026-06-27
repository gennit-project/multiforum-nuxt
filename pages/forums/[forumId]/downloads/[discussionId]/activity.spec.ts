import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';
import LabelChangeHistory from '@/components/discussion/detail/activityFeed/LabelChangeHistory.vue';

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

  it('renders label-change history when the download has label changes', async () => {
    const wrapper = await mountWith({
      PastTitleVersions: [],
      DiscussionChannels: [
        {
          channelUniqueName: 'cats',
          LabelChangeHistory: [
            { id: 'l1', actionType: 'added', labelDisplayName: 'Bug' },
          ],
        },
      ],
    });
    expect(wrapper.findComponent(LabelChangeHistory).exists()).toBe(true);
    expect(wrapper.text()).not.toContain('No activity to display yet.');
  });

  it('renders both title and label history when both exist', async () => {
    const wrapper = await mountWith({
      PastTitleVersions: [{ id: 't1' }],
      DiscussionChannels: [
        {
          channelUniqueName: 'cats',
          LabelChangeHistory: [
            { id: 'l1', actionType: 'removed', labelDisplayName: 'Bug' },
          ],
        },
      ],
    });
    expect(wrapper.findComponent(DiscussionTitleVersions).exists()).toBe(true);
    expect(wrapper.findComponent(LabelChangeHistory).exists()).toBe(true);
  });
});
