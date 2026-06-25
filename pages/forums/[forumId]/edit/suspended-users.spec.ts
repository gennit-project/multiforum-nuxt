import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channel: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(channel ? { channels: [channel] } : { channels: [] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./suspended-users.vue')).default;
  return shallowMount(Page);
};

describe('forum suspended users page', () => {
  it('names the current forum in the description', async () => {
    const wrapper = await mountWith({ SuspendedUsers: [] });
    expect(wrapper.text()).toContain('active suspensions of users from cats');
  });

  it('shows the empty-state message when no users are suspended', async () => {
    const wrapper = await mountWith({ SuspendedUsers: [] });
    expect(wrapper.text()).toContain('This forum has no suspended users.');
  });

  it('shows the active suspension count from the aggregate', async () => {
    const wrapper = await mountWith({
      SuspendedUsers: [{ username: 'a' }],
      SuspendedUsersAggregate: { count: 4 },
    });
    expect(wrapper.text()).toContain('Active Suspensions (4)');
  });
});
