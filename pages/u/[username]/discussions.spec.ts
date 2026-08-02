import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import DiscussionItemInProfile from '@/components/user/DiscussionItemInProfile.vue';

const channelState = vi.hoisted(() => ({
  selectedChannels: { value: [] as string[] },
  hasSelectedChannels: { value: false },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: channelState.selectedChannels,
    hasSelectedChannels: channelState.hasSelectedChannels,
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./discussions.vue')).default;
  return shallowMount(Page);
};

describe('user discussions profile page', () => {
  it('shows an empty-state message when the user has no discussions', async () => {
    const wrapper = await mountWith({ users: [{ Discussions: [] }] });
    expect(wrapper.text()).toContain('No discussions yet');
  });

  it('renders an item per discussion', async () => {
    const wrapper = await mountWith({
      users: [{ Discussions: [{ id: 'd1' }, { id: 'd2' }] }],
    });
    expect(wrapper.findAllComponents(DiscussionItemInProfile)).toHaveLength(2);
  });

  it('adds selected channels to the discussion query', async () => {
    channelState.selectedChannels.value = ['cats'];
    channelState.hasSelectedChannels.value = true;
    await mountWith({ users: [{ Discussions: [] }] });

    expect(mockedUseQuery.mock.calls.at(-1)?.[1]()).toEqual({
      username: 'alice',
      where: {
        AND: [
          { OR: [{ hasDownload: false }, { hasDownload: null }] },
          {
            DiscussionChannels_SOME: { channelUniqueName_IN: ['cats'] },
          },
        ],
      },
    });
  });
});
