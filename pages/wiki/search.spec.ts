import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import WikiPagePinButton from '@/components/wiki/WikiPagePinButton.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/utils/getDiscussionFilterValuesFromParams', () => ({
  getDiscussionFilterValuesFromParams: () => ({
    searchInput: '',
    channels: [],
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const refetchWikiPinChannels = vi.fn();

const mountWith = async (
  wikiPages: unknown[],
  featuredWikiPages: unknown[] = [],
  channels: unknown[] = []
) => {
  mockedUseQuery.mockReset();
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        getSiteWideWikiList: {
          wikiPages,
          featuredWikiPages,
          aggregateWikiPageCount: wikiPages.length,
        },
      }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ channels }),
      refetch: refetchWikiPinChannels,
    });
  const Page = (await import('./search.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: { template: '<div><slot /></div>' } } },
  });
};

describe('wiki search page', () => {
  it('shows the empty message when no wiki pages match', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No wiki pages match your search.');
  });

  it('renders a result row per matching wiki page', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'Cats',
        slug: 'cats',
        channelUniqueName: 'cats',
        body: 'hi',
      },
      {
        id: 'w2',
        title: 'Dogs',
        slug: 'dogs',
        channelUniqueName: 'dogs',
        body: 'hi',
      },
    ]);
    expect(
      wrapper.findAll('[data-testid="wiki-search-results"] > li')
    ).toHaveLength(2);
  });

  it('renders featured wiki pages above normal results', async () => {
    const wrapper = await mountWith(
      [
        {
          id: 'w1',
          title: 'Cats',
          slug: 'cats',
          channelUniqueName: 'cats',
          body: 'hi',
        },
      ],
      [
        {
          id: 'featured',
          title: 'Start here',
          slug: 'start',
          channelUniqueName: 'help',
          body: 'hello',
        },
      ]
    );
    expect(wrapper.find('[data-testid="featured-wiki-pages"]').exists()).toBe(
      true
    );
  });

  it('does not duplicate featured wiki pages in normal results', async () => {
    const page = {
      id: 'w1',
      title: 'Cats',
      slug: 'cats',
      channelUniqueName: 'cats',
      body: 'hi',
    };
    const wrapper = await mountWith([page], [page]);
    expect(
      wrapper.findAll('[data-testid="wiki-search-results"] > li')
    ).toHaveLength(0);
  });

  it('passes plain-text wiki titles to search result highlighting', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: '**Cat** [Care](https://example.com)',
        slug: 'cats',
        channelUniqueName: 'cats',
        body: 'hi',
      },
    ]);

    expect(wrapper.findComponent(HighlightedSearchTerms).props('text')).toBe(
      'Cat Care'
    );
  });

  it('offers the existing pin control for a result with forum data', async () => {
    const wrapper = await mountWith(
      [
        {
          id: 'w1',
          title: 'Cats',
          slug: 'cats',
          channelUniqueName: 'cats',
          body: 'hi',
        },
      ],
      [],
      [{ uniqueName: 'cats', PinnedWikiPages: [] }]
    );

    expect(wrapper.findComponent(WikiPagePinButton).props()).toMatchObject({
      channelUniqueName: 'cats',
      wikiPage: expect.objectContaining({ id: 'w1' }),
    });
  });

  it('refreshes forum pin data after a pin changes', async () => {
    refetchWikiPinChannels.mockClear();
    const wrapper = await mountWith(
      [
        {
          id: 'w1',
          title: 'Cats',
          slug: 'cats',
          channelUniqueName: 'cats',
          body: 'hi',
        },
      ],
      [],
      [{ uniqueName: 'cats', PinnedWikiPages: [] }]
    );

    wrapper.findComponent(WikiPagePinButton).vm.$emit('pinnedChanged');

    expect(refetchWikiPinChannels).toHaveBeenCalledOnce();
  });
});
