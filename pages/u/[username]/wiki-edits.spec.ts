import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const channelFilter = vi.hoisted(() => ({
  selected: [] as string[],
  hasSelected: false,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: ref(channelFilter.selected),
    hasSelectedChannels: ref(channelFilter.hasSelected),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountWith = async (wikiPages: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ wikiPages }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./wiki-edits.vue')).default;
  return shallowMount(Page, { global: { stubs: { NuxtLink: NuxtLinkStub } } });
};

const SAMPLE = [
  {
    id: 'w1',
    title: 'Cat Care',
    body: 'Current body',
    editReason: 'Current revision',
    slug: 'cat-care',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    channelUniqueName: 'cats',
    VersionAuthor: { username: 'alice' },
    PastVersions: [
      { id: 'v1', createdAt: '2024-02-01T00:00:00Z', editReason: 'Tidied up' },
    ],
  },
];

describe('user wiki edits page', () => {
  beforeEach(() => {
    channelFilter.selected = [];
    channelFilter.hasSelected = false;
    mockedUseQuery.mockReset();
  });

  it('shows the empty-state message when there are no edits', async () => {
    expect((await mountWith([])).text()).toContain('No wiki edits yet');
  });

  it('flattens past versions across wiki pages into one item each', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'Page 1',
        body: 'Current body',
        editReason: 'Current revision',
        slug: 'page-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-02-02T00:00:00Z',
        channelUniqueName: 'cats',
        VersionAuthor: { username: 'alice' },
        PastVersions: [
          { id: 'v1', createdAt: '2024-01-01T00:00:00Z' },
          { id: 'v2', createdAt: '2024-02-01T00:00:00Z' },
        ],
      },
    ]);
    expect(wrapper.findAll('li')).toHaveLength(3);
  });

  it('orders edits newest first', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'OLDER',
        body: 'Older current body',
        editReason: 'Older current revision',
        slug: 'older',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        channelUniqueName: 'cats',
        VersionAuthor: { username: 'bob' },
        PastVersions: [{ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }],
      },
      {
        id: 'w2',
        title: 'NEWER',
        body: 'Newer current body',
        editReason: 'Newer current revision',
        slug: 'newer',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-02-02T00:00:00Z',
        channelUniqueName: 'cats',
        VersionAuthor: { username: 'alice' },
        PastVersions: [{ id: 'v2', createdAt: '2024-02-01T00:00:00Z' }],
      },
    ]);
    const text = wrapper.text();
    expect(text.indexOf('NEWER')).toBeLessThan(text.indexOf('OLDER'));
  });

  it('shows the page title, channel, and edit reason', async () => {
    const wrapper = await mountWith(SAMPLE);
    const text = wrapper.text();
    expect(text).toContain('Cat Care');
    expect(text).toContain('in cats');
    expect(text).toContain('Tidied up');
  });

  it('links to the wiki page and the revision diff', async () => {
    const wrapper = await mountWith(SAMPLE);
    const targets = wrapper
      .findAllComponents(NuxtLinkStub)
      .map((l) => l.props('to'));
    expect(targets).toContain('/forums/cats/wiki/cat-care');
    expect(targets).toContain(
      '/forums/cats/wiki/revisions/diff/cat-care/selected-v1'
    );
    expect(targets).toContain(
      '/forums/cats/wiki/revisions/diff/cat-care/selected-current'
    );
  });

  it('narrows the query to the selected channels when filtering', async () => {
    channelFilter.selected = ['cats'];
    channelFilter.hasSelected = true;
    await mountWith(SAMPLE);

    // The page passes a reactive variables getter to useQuery.
    const variablesGetter = mockedUseQuery.mock.calls[0][1] as () => {
      where: { AND?: Array<{ channelUniqueName_IN?: string[] }> };
    };
    const where = variablesGetter().where;
    expect(where.AND?.[1]?.channelUniqueName_IN).toEqual(['cats']);
  });

  it('includes the current wiki version when the profile user authored it', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'Current Only',
        body: 'Current wiki body',
        editReason: 'Most recent update',
        slug: 'current-only',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        channelUniqueName: 'cats',
        VersionAuthor: { username: 'alice' },
        PastVersions: [],
      },
    ]);

    expect(wrapper.text()).toContain('Current Only');
  });
});
