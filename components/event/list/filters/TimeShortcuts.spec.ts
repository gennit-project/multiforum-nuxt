import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import TimeShortcuts from '@/components/event/list/filters/TimeShortcuts.vue';
import {
  timeFilterShortcuts,
  timeShortcutValues,
} from '@/components/event/list/filters/eventSearchOptions';

const h = vi.hoisted(() => ({ route: null as unknown, replace: vi.fn(), filterValues: {} as Record<string, unknown> }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ replace: h.replace }),
}));
vi.mock('@/components/event/list/filters/getEventFilterValuesFromParams', () => ({
  getFilterValuesFromParams: () => h.filterValues,
}));

const firstShortcut = timeFilterShortcuts[0];

const tagStub = {
  name: 'Tag',
  props: ['tag', 'active', 'dataTestid', 'hideIcon', 'large'],
  emits: ['click'],
  template: '<button :data-active="active" @click="$emit(\'click\')">{{ tag }}</button>',
};

const mountShortcuts = () =>
  mount(TimeShortcuts, { global: { stubs: { Tag: tagStub, TagComponent: tagStub } } });

const tags = (w: ReturnType<typeof mount>) => w.findAllComponents(tagStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats' }, query: {} };
  h.filterValues = {};
});

describe('TimeShortcuts rendering', () => {
  it('renders a tag per shortcut', () => {
    const wrapper = mountShortcuts();

    expect(tags(wrapper)).toHaveLength(timeFilterShortcuts.length);
  });

  it('marks the active shortcut from the filter values', () => {
    h.filterValues = { timeShortcut: firstShortcut.value };
    const wrapper = mountShortcuts();

    expect(tags(wrapper)[0].props('active')).toBe(true);
  });
});

describe('TimeShortcuts interactions', () => {
  it('applies a time filter when an inactive shortcut is clicked', async () => {
    const wrapper = mountShortcuts();

    await tags(wrapper)[0].vm.$emit('click');

    expect(h.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ timeShortcut: firstShortcut.value }),
      })
    );
  });

  it('clears the filter when the active shortcut is clicked again', async () => {
    h.route = { params: { forumId: 'cats' }, query: { timeShortcut: firstShortcut.value } };
    const wrapper = mountShortcuts();

    await tags(wrapper)[0].vm.$emit('click');

    expect(h.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ timeShortcut: timeShortcutValues.NONE }),
      })
    );
  });
});
