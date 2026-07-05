import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ForumFinder from '@/components/nav/ForumFinder.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, error: h.error, loading: h.loading }),
}));

const mountFinder = () =>
  mount(ForumFinder, {
    global: {
      stubs: {
        SearchBar: {
          name: 'SearchBar',
          props: ['initialValue'],
          emits: ['update-search-input'],
          template: '<input class="search" />',
        },
        AvatarComponent: { name: 'AvatarComponent', template: '<div />' },
      },
    },
  });

const resultButton = (w: ReturnType<typeof mount>, name: string) =>
  w.find(`[data-testid="forum-finder-result-${name}"]`);

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref({
    channels: [
      { uniqueName: 'cats', displayName: 'Cats', channelIconURL: '' },
      { uniqueName: 'dogs', displayName: 'Dogs', channelIconURL: '' },
    ],
  });
  h.error = ref(null);
  h.loading = ref(false);
});

describe('ForumFinder rendering', () => {
  it('renders a result button per forum', () => {
    const wrapper = mountFinder();

    expect(wrapper.findAll('[data-testid^="forum-finder-result-"]')).toHaveLength(
      2
    );
  });

  it('shows the forum display name', () => {
    const wrapper = mountFinder();

    expect(resultButton(wrapper, 'cats').text()).toContain('Cats');
  });

  it('shows a loading message while loading with no results', () => {
    h.loading = ref(true);
    h.result = ref({ channels: [] });
    const wrapper = mountFinder();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows the query error message', () => {
    h.error = ref({ message: 'query boom' });
    const wrapper = mountFinder();

    expect(wrapper.text()).toContain('query boom');
  });

  it('shows an empty message when there are no forums', () => {
    h.result = ref({ channels: [] });
    const wrapper = mountFinder();

    expect(wrapper.text()).toContain('No forums found');
  });
});

describe('ForumFinder selection', () => {
  it('emits select with the forum uniqueName when a result is clicked', async () => {
    const wrapper = mountFinder();

    await resultButton(wrapper, 'dogs').trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual(['dogs']);
  });

  it('updates the search input from the search bar', async () => {
    const wrapper = mountFinder();

    await wrapper
      .getComponent({ name: 'SearchBar' })
      .vm.$emit('update-search-input', 'ca');

    expect(
      wrapper.getComponent({ name: 'SearchBar' }).props('initialValue')
    ).toBe('ca');
  });
});
