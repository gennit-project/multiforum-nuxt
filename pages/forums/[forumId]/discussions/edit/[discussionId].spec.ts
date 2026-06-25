import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', discussionId: 'd1' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
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
  useModProfileName: () => ref('mod-1'),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('discussion edit page', () => {
  it('renders the discussion edit form for authenticated users', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({
        discussions: [
          {
            id: 'd1',
            title: 'Hello',
            body: '',
            Tags: [],
            DiscussionChannels: [],
            Author: { username: 'alice' },
            Album: { Images: [], imageOrder: [] },
          },
        ],
      }),
      onResult: vi.fn(),
      loading: ref(false),
      error: ref(null),
    });
    const Page = (await import('./[discussionId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { RequireAuth: RequireAuthStub } },
    });
    expect(wrapper.findComponent(CreateEditDiscussionFields).exists()).toBe(true);
  });
});
