import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
    name: 'forums-forumId-edit',
    fullPath: '/forums/cats/edit',
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('forum settings edit page', () => {
  it('renders the channel edit fields', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({
        channels: [{ uniqueName: 'cats', Tags: [], Admins: [], rules: '[]' }],
      }),
      loading: ref(false),
      error: ref(null),
      onResult: vi.fn(),
    });
    const Page = (await import('./edit.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { mocks: { $route: { fullPath: '/forums/cats/edit' } } },
    });
    expect(wrapper.findComponent(CreateEditChannelFields).exists()).toBe(true);
  });
});
