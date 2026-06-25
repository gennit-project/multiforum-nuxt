import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', slug: 'home' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (wikiPage: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(wikiPage ? { wikiPages: [wikiPage] } : { wikiPages: [] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./[slug].vue')).default;
  return shallowMount(Page);
};

describe('wiki revisions page', () => {
  it('shows the not-found message when the wiki page is missing', async () => {
    const wrapper = await mountWith(null);
    expect(wrapper.text()).toContain("This wiki page doesn't exist.");
  });

  it('shows the no-edits message for a never-edited page', async () => {
    const wrapper = await mountWith({
      title: 'Home',
      body: 'hello',
      createdAt: '2024-01-01T00:00:00Z',
      PastVersions: [],
      VersionAuthor: { username: 'alice' },
    });
    expect(wrapper.text()).toContain('This page has not been edited yet.');
  });

  it('lists one row per edit when the page has past versions', async () => {
    const wrapper = await mountWith({
      title: 'Home',
      body: 'hello v2',
      updatedAt: '2024-02-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      PastVersions: [
        {
          id: 'v1',
          body: 'hello v1',
          createdAt: '2024-01-15T00:00:00Z',
          Author: { username: 'bob' },
        },
      ],
      VersionAuthor: { username: 'alice' },
    });
    expect(wrapper.text()).toContain('Most recent edit');
  });
});
