import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: ref([]),
    hasSelectedChannels: ref(false),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (wikiPages: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ wikiPages }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./wiki-edits.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
  });
};

describe('user wiki edits page', () => {
  it('shows the empty-state message when there are no edits', async () => {
    expect((await mountWith([])).text()).toContain('No wiki edits yet');
  });

  it('flattens past versions across wiki pages into one item each', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'Page 1',
        slug: 'page-1',
        channelUniqueName: 'cats',
        PastVersions: [
          { id: 'v1', createdAt: '2024-01-01T00:00:00Z' },
          { id: 'v2', createdAt: '2024-02-01T00:00:00Z' },
        ],
      },
    ]);
    expect(wrapper.findAll('li')).toHaveLength(2);
  });

  it('orders edits newest first', async () => {
    const wrapper = await mountWith([
      {
        id: 'w1',
        title: 'OLDER',
        slug: 'older',
        channelUniqueName: 'cats',
        PastVersions: [{ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }],
      },
      {
        id: 'w2',
        title: 'NEWER',
        slug: 'newer',
        channelUniqueName: 'cats',
        PastVersions: [{ id: 'v2', createdAt: '2024-02-01T00:00:00Z' }],
      },
    ]);
    const text = wrapper.text();
    expect(text.indexOf('NEWER')).toBeLessThan(text.indexOf('OLDER'));
  });
});
