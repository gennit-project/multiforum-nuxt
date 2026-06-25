import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
  useHead: vi.fn(),
}));

describe('forum discussions index page', () => {
  it('renders the discussion search in forum-scoped mode', async () => {
    const Page = (await import('./index.vue')).default;
    const SearchDiscussions = (
      await import('@/components/discussion/list/SearchDiscussions.vue')
    ).default;
    const search = shallowMount(Page).findComponent(SearchDiscussions);
    expect(search.props('isForumScoped')).toBe(true);
  });
});
