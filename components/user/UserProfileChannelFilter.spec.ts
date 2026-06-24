import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UserProfileChannelFilter from '@/components/user/UserProfileChannelFilter.vue';

const h = vi.hoisted(() => ({
  route: null as unknown,
  push: vi.fn(),
  replace: vi.fn(),
  selectedChannels: null as unknown,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push, replace: h.replace }),
}));
vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({ selectedChannels: h.selectedChannels }),
}));

const filterChipStub = {
  name: 'FilterChip',
  props: ['label', 'highlighted'],
  template: '<div><slot name="icon" /><slot name="content" /></div>',
};
const forumListStub = {
  name: 'SearchableForumList',
  props: ['selectedChannels'],
  emits: ['toggle-selection'],
  template: '<div class="forum-list" />',
};

const mountFilter = () =>
  mount(UserProfileChannelFilter, {
    global: {
      stubs: { FilterChip: filterChipStub, SearchableForumList: forumListStub, ChannelIcon: true },
    },
  });

const chip = (w: ReturnType<typeof mount>) => w.getComponent(filterChipStub);
const list = (w: ReturnType<typeof mount>) => w.getComponent(forumListStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { query: {} };
  h.selectedChannels = ref([]);
});

describe('UserProfileChannelFilter label', () => {
  it('shows a default label with no channels selected', () => {
    const wrapper = mountFilter();

    expect(typeof chip(wrapper).props('label')).toBe('string');
  });

  it('is not highlighted with no channels selected', () => {
    const wrapper = mountFilter();

    expect(chip(wrapper).props('highlighted')).toBe(false);
  });

  it('is highlighted when channels are selected', () => {
    h.selectedChannels = ref(['cats']);
    const wrapper = mountFilter();

    expect(chip(wrapper).props('highlighted')).toBe(true);
  });
});

describe('UserProfileChannelFilter selection', () => {
  it('adds a channel via the forum list', async () => {
    const wrapper = mountFilter();

    await list(wrapper).vm.$emit('toggle-selection', 'cats');

    const calls = h.push.mock.calls.length + h.replace.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
  });

  it('passes the selected channels to the forum list', () => {
    h.selectedChannels = ref(['cats', 'dogs']);
    const wrapper = mountFilter();

    expect(list(wrapper).props('selectedChannels')).toEqual(['cats', 'dogs']);
  });

  it('removes an already-selected channel on toggle', async () => {
    h.selectedChannels = ref(['cats']);
    const wrapper = mountFilter();

    await list(wrapper).vm.$emit('toggle-selection', 'cats');

    const calls = h.push.mock.calls.length + h.replace.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
  });
});
