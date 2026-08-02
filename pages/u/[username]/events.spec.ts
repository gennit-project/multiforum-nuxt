import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import EventItemInProfile from '@/components/user/EventItemInProfile.vue';

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
  const Page = (await import('./events.vue')).default;
  return shallowMount(Page);
};

describe('user events profile page', () => {
  it('shows an empty-state message when the user has no events', async () => {
    const wrapper = await mountWith({ users: [{ Events: [] }] });
    expect(wrapper.text()).toContain('No events yet');
  });

  it('renders an item per event', async () => {
    const wrapper = await mountWith({
      users: [{ Events: [{ id: 'e1' }, { id: 'e2' }] }],
    });
    expect(wrapper.findAllComponents(EventItemInProfile)).toHaveLength(2);
  });

  it('adds selected channels to the event query', async () => {
    channelState.selectedChannels.value = ['events'];
    channelState.hasSelectedChannels.value = true;
    await mountWith({ users: [{ Events: [] }] });

    expect(mockedUseQuery.mock.calls.at(-1)?.[1]()).toEqual({
      username: 'alice',
      where: {
        EventChannels_SOME: { channelUniqueName_IN: ['events'] },
      },
    });
  });
});
