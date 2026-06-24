import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import IssueList from '@/components/mod/IssueList.vue';
import type { Issue } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  refetch: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  setSelected: vi.fn(),
  clearSelected: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    refetch: h.refetch,
  }),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: h.push, replace: h.replace }),
}));
vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    selectedIssueNumber: ref(null),
    setSelectedIssueSelection: h.setSelected,
    clearSelectedIssueSelection: h.clearSelected,
  }),
}));
vi.mock('pinia', () => ({ storeToRefs: (s: unknown) => s }));

const issue = (id: string) => ({ id, issueNumber: 1, title: 'An issue' }) as unknown as Issue;

const mountList = () =>
  mount(IssueList, {
    global: {
      stubs: {
        SearchBar: { name: 'SearchBar', props: ['initialValue'], emits: ['update-search-input'], template: '<div class="search" />' },
        ModIssueListItem: { name: 'ModIssueListItem', props: ['issue', 'channelId', 'selectedIssueNumber'], emits: ['select'], template: '<li class="item" />' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({ channels: [{ Issues: [issue('i1')] }] });
  h.error = ref(null);
  h.loading = ref(false);
});

describe('IssueList rendering', () => {
  it('renders an item per issue', () => {
    const wrapper = mountList();

    expect(wrapper.findAllComponents({ name: 'ModIssueListItem' })).toHaveLength(1);
  });

  it('shows the empty state when there are no issues', () => {
    h.result = ref({ channels: [{ Issues: [] }] });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('There are no issues yet');
  });

  it('returns no issues while loading', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.findAllComponents({ name: 'ModIssueListItem' })).toHaveLength(0);
  });

  it('returns no issues on error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.findAllComponents({ name: 'ModIssueListItem' })).toHaveLength(0);
  });

  it('hides the empty state while loading', () => {
    h.loading = ref(true);
    h.result = ref({ channels: [{ Issues: [] }] });
    const wrapper = mountList();

    expect(wrapper.text()).not.toContain('There are no issues yet');
  });
});

describe('IssueList interactions', () => {
  it('updates the route filters on search', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'SearchBar' }).vm.$emit('update-search-input', 'spam');

    expect(h.push.mock.calls.length + h.replace.mock.calls.length).toBeGreaterThan(0);
  });

  it('records the selected issue in the store', async () => {
    const wrapper = mountList();
    const payload = { issueNumber: 1, title: 'An issue', channelId: 'cats' };

    await wrapper.getComponent({ name: 'ModIssueListItem' }).vm.$emit('select', payload);

    expect(h.setSelected).toHaveBeenCalledWith(payload);
  });
});
