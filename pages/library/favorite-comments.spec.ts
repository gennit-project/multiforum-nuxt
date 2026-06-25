import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: ref([]) }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (comments: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ users: [{ FavoriteComments: comments }] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./favorite-comments.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: { RequireAuth: RequireAuthStub, NuxtLink: { template: '<a><slot /></a>' } },
    },
  });
};

describe('favorite comments page', () => {
  it('shows the empty state when there are no favorites', async () => {
    expect((await mountWith([])).text()).toContain('No favorite comments yet');
  });

  it('renders a favorited comment via the markdown renderer', async () => {
    const wrapper = await mountWith([
      {
        id: 'c1',
        text: 'A memorable comment',
        createdAt: '2024-01-01T00:00:00Z',
        CommentAuthor: { __typename: 'User', username: 'bob' },
      },
    ]);
    expect(wrapper.findComponent(MarkdownRenderer).props('text')).toBe(
      'A memorable comment'
    );
  });
});
