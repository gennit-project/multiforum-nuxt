import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';

const useHead = vi.fn();
const routeParams: { discussionId?: string; forumId?: string } = {
  discussionId: 'd1',
  forumId: 'cats',
};

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: routeParams }),
  useHead: (...args: unknown[]) => useHead(...args),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountPage = async () => {
  mockedUseQuery.mockReturnValue({ result: ref({ discussions: [] }) });
  const Page = (await import('./[discussionId].vue')).default;
  return shallowMount(Page);
};

describe('discussion detail page', () => {
  it('renders the discussion detail content when an id is present', async () => {
    routeParams.discussionId = 'd1';
    const wrapper = await mountPage();
    expect(wrapper.findComponent(DiscussionDetailContent).props('discussionId')).toBe(
      'd1'
    );
  });

  it('shows an error banner when there is no discussion id', async () => {
    routeParams.discussionId = '';
    const wrapper = await mountPage();
    expect(wrapper.findComponent(ErrorBanner).exists()).toBe(true);
  });
});
