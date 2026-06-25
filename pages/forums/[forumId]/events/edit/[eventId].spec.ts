import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CreateEditEventFields from '@/components/event/form/CreateEditEventFields.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', eventId: 'e1' } }),
  useRouter: () => ({ push: vi.fn() }),
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

describe('event edit page', () => {
  it('renders the event edit form for authenticated users', async () => {
    mockedUseQuery.mockReturnValue({
      result: ref({
        events: [
          {
            id: 'e1',
            title: 'Meetup',
            description: '',
            Tags: [],
            EventChannels: [],
            startTime: '2024-01-01T18:00:00Z',
            endTime: '2024-01-01T20:00:00Z',
            canceled: false,
          },
        ],
      }),
      onResult: vi.fn(),
      loading: ref(false),
      error: ref(null),
    });
    const Page = (await import('./[eventId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { RequireAuth: RequireAuthStub } },
    });
    expect(wrapper.findComponent(CreateEditEventFields).exists()).toBe(true);
  });
});
