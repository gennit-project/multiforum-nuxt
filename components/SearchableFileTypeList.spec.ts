import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SearchableFileTypeList from '@/components/SearchableFileTypeList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, error: h.error, loading: h.loading }),
}));

const config = (fileTypes: string[] | null) => ({
  serverConfigs: [{ allowedFileTypes: fileTypes }],
});

const mountList = (props: Record<string, unknown> = {}) =>
  mount(SearchableFileTypeList, {
    props,
    global: {
      stubs: {
        SearchBar: { name: 'SearchBar', props: ['initialValue'], emits: ['update-search-input'], template: '<input class="search" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const checkbox = (w: ReturnType<typeof mount>, type: string) =>
  w.find(`input[aria-label="Select file type ${type}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(config(['png', 'glb', 'stl']));
  h.error = ref(null);
  h.loading = ref(false);
});

describe('SearchableFileTypeList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error banner', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows the no-config message when none are configured', () => {
    h.result = ref(config([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('No file types are configured');
  });
});

describe('SearchableFileTypeList list', () => {
  it('renders a checkbox per allowed file type', () => {
    const wrapper = mountList();

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3);
  });

  it('checks a file type that is already selected', () => {
    const wrapper = mountList({ selectedFileTypes: ['png'] });

    expect((checkbox(wrapper, 'png').element as HTMLInputElement).checked).toBe(
      true
    );
  });

  it('emits toggleSelection when a type is checked', async () => {
    const wrapper = mountList();

    await checkbox(wrapper, 'glb').trigger('change');

    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual(['glb']);
  });
});

describe('SearchableFileTypeList search', () => {
  it('filters the list by the search input', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'SearchBar' }).vm.$emit('update-search-input', 'st');

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(1);
  });

  it('shows a no-match message when the search matches nothing', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'SearchBar' }).vm.$emit('update-search-input', 'zzz');

    expect(wrapper.text()).toContain('No file types match your search');
  });
});
