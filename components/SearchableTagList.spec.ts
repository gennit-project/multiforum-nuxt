import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import SearchableTagList from '@/components/SearchableTagList.vue';

const h = vi.hoisted(() => ({
  createTag: vi.fn(),
  createError: null as unknown,
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: h.createTag, error: h.createError, loading: ref(false) }),
  useQuery: () => ({ result: h.result, error: h.error, loading: h.loading }),
}));

const mountList = (props: Record<string, unknown> = {}) =>
  mount(SearchableTagList, {
    props,
    global: {
      stubs: {
        SearchBar: { name: 'SearchBar', props: ['initialValue', 'disabled'], emits: ['update-search-input'], template: '<input class="search" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const checkbox = (w: ReturnType<typeof mount>, tag: string) =>
  w.find(`input[aria-label="Select tag ${tag}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  h.createTag = vi.fn(() =>
    Promise.resolve({ data: { createTags: { tags: [{ text: 'newtag' }] } } })
  );
  h.createError = ref(null);
  h.result = ref({ tags: [{ text: 'vue' }, { text: 'js' }] });
  h.error = ref(null);
  h.loading = ref(false);
});

describe('SearchableTagList rendering', () => {
  it('renders a checkbox per tag', () => {
    const wrapper = mountList();

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2);
  });

  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows query graphQL errors', () => {
    h.error = ref({ graphQLErrors: [{ message: 'query boom' }] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('query boom');
  });

  it('checks a tag that is already selected', () => {
    const wrapper = mountList({ selectedTags: ['vue'] });

    expect((checkbox(wrapper, 'vue').element as HTMLInputElement).checked).toBe(
      true
    );
  });
});

describe('SearchableTagList selection', () => {
  it('emits toggleSelection when a tag is checked', async () => {
    const wrapper = mountList();

    await checkbox(wrapper, 'vue').trigger('change');

    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual(['vue']);
  });

  it('updates the search input from the search bar', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'SearchBar' }).vm.$emit('update-search-input', 'vu');

    expect(wrapper.getComponent({ name: 'SearchBar' }).props('initialValue')).toBe('vu');
  });
});

describe('SearchableTagList create tag', () => {
  it('creates a new tag on Enter', async () => {
    const wrapper = mountList();
    await wrapper.find('.search').setValue('newtag');

    await wrapper.find('.search').trigger('keydown.enter');
    await flushPromises();

    expect(h.createTag).toHaveBeenCalledWith({ input: [{ text: 'newtag' }] });
  });

  it('emits toggleSelection for the created tag', async () => {
    const wrapper = mountList();
    await wrapper.find('.search').setValue('newtag');

    await wrapper.find('.search').trigger('keydown.enter');
    await flushPromises();

    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual(['newtag']);
  });

  it('does not create a tag for empty input', async () => {
    const wrapper = mountList();
    await wrapper.find('.search').setValue('   ');

    await wrapper.find('.search').trigger('keydown.enter');
    await flushPromises();

    expect(h.createTag).not.toHaveBeenCalled();
  });

  it('does not create a tag that is already selected', async () => {
    const wrapper = mountList({ selectedTags: ['newtag'] });
    await wrapper.find('.search').setValue('newtag');

    await wrapper.find('.search').trigger('keydown.enter');
    await flushPromises();

    expect(h.createTag).not.toHaveBeenCalled();
  });

  it('shows the create-tag error banner', () => {
    h.createError = ref({ message: 'create boom' });
    const wrapper = mountList();

    expect(wrapper.find('.err').text()).toContain('create boom');
  });
});
