import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import OwnedForumsPage from './ownedForums.vue';
import ChannelList from '@/components/channel/ChannelList.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    loading: ref(false),
    error: ref(null),
  });
  return shallowMount(OwnedForumsPage);
};

describe('user owned forums page', () => {
  it('shows an empty-state message when the user owns no forums', () => {
    const wrapper = mountWith({
      users: [{ AdminOfChannels: [], AdminOfChannelsAggregate: { count: 0 } }],
    });
    expect(wrapper.text()).toContain('This user is not a forum owner.');
  });

  it('renders the channel list when the user owns forums', () => {
    const wrapper = mountWith({
      users: [
        {
          AdminOfChannels: [{ uniqueName: 'dogs' }],
          AdminOfChannelsAggregate: { count: 1 },
        },
      ],
    });
    expect(wrapper.findComponent(ChannelList).props('channels')).toEqual([
      { uniqueName: 'dogs' },
    ]);
  });
});
