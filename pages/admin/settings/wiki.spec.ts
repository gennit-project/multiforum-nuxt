import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import WikiSettingsPage from './wiki.vue';

const h = vi.hoisted(() => ({
  searchResult: { value: {} },
  selectedResult: { value: {} },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document: string) => ({
    result: document === 'selectedQuery' ? h.selectedResult : h.searchResult,
    loading: { value: false },
  })),
}));

vi.mock('@/graphQLData/wiki/queries', () => ({
  GET_SITE_WIDE_WIKI_LIST: 'searchQuery',
  GET_WIKI_PAGES_BY_IDS: 'selectedQuery',
}));

const mountPage = (featuredWikiPageIds: string[] = []) =>
  shallowMount(WikiSettingsPage, {
    props: {
      editMode: true,
      formValues: { featuredWikiPageIds },
    },
    global: {
      stubs: {
        FormRow: { template: '<div><slot name="content" /></div>' },
        LoadingSpinner: { template: '<div />' },
      },
    },
  });

beforeEach(() => {
  h.searchResult.value = {
    getSiteWideWikiList: {
      wikiPages: [
        { id: 'w1', title: 'Alpha', slug: 'alpha', channelUniqueName: 'cats' },
        { id: 'w2', title: 'Beta', slug: 'beta', channelUniqueName: 'dogs' },
      ],
    },
  };
  h.selectedResult.value = {
    wikiPages: [
      { id: 'w1', title: 'Alpha', slug: 'alpha', channelUniqueName: 'cats' },
      { id: 'w2', title: 'Beta', slug: 'beta', channelUniqueName: 'dogs' },
    ],
  };
});

describe('admin wiki settings page', () => {
  it('emits selected IDs when adding a featured page', async () => {
    const wrapper = mountPage();
    await wrapper.find('[data-testid="featured-wiki-search-results"] button').trigger('click');
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { featuredWikiPageIds: ['w1'] },
    ]);
  });

  it('emits selected IDs when removing a featured page', async () => {
    const wrapper = mountPage(['w1']);
    await wrapper.find('[data-testid="featured-wiki-selected-list"] button:last-child').trigger('click');
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { featuredWikiPageIds: [] },
    ]);
  });

  it('emits reordered IDs when moving a featured page', async () => {
    const wrapper = mountPage(['w1', 'w2']);
    const downButton = wrapper.findAll('[data-testid="featured-wiki-selected-list"] button')[1];
    await downButton.trigger('click');
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { featuredWikiPageIds: ['w2', 'w1'] },
    ]);
  });
});
