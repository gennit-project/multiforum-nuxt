import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import MarkdownPreview from '@/components/MarkdownPreview.vue';

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

const sampleComment = {
  id: 'c1',
  text: 'A memorable comment ![cat](https://example.com/cat.png)',
  createdAt: '2024-01-01T00:00:00Z',
  CommentAuthor: { __typename: 'User', username: 'bob' },
  DiscussionChannel: {
    channelUniqueName: 'cats',
    discussionId: 'd1',
    Discussion: { id: 'd1', title: 'Cats', hasDownload: false },
  },
};

describe('favorite comments page', () => {
  it('shows the empty state when there are no favorites', async () => {
    expect((await mountWith([])).text()).toContain('No favorite comments yet');
  });

  // Regression: the comment body must render via MarkdownPreview (which wires up
  // the inline-image lightbox), not the bare MarkdownRenderer which cannot
  // expand images.
  it('renders the comment body via MarkdownPreview', async () => {
    const wrapper = await mountWith([sampleComment]);
    expect(wrapper.findComponent(MarkdownPreview).props('text')).toBe(
      sampleComment.text
    );
  });

  // Regression: the gallery/lightbox must be enabled so inline images expand.
  it('enables the image lightbox on the comment body', async () => {
    const wrapper = await mountWith([sampleComment]);
    expect(wrapper.findComponent(MarkdownPreview).props('disableGallery')).toBe(
      false
    );
  });

  // Regression: the comment body is no longer wrapped in a permalink link
  // (which nested anchors and blocked the lightbox); a dedicated permalink link
  // is rendered instead.
  it('renders a View Comment permalink link', async () => {
    const wrapper = await mountWith([sampleComment]);
    expect(wrapper.text()).toContain('View Comment');
  });
});
