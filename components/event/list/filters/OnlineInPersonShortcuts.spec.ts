import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import OnlineInPersonShortcuts from '@/components/event/list/filters/OnlineInPersonShortcuts.vue';
import { LocationFilterTypes } from '@/components/event/list/filters/locationFilterTypes';

const h = vi.hoisted(() => ({ route: null as unknown, replace: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ replace: h.replace }),
}));
vi.mock('@/components/event/list/filters/getEventFilterValuesFromParams', () => ({
  getFilterValuesFromParams: () => ({}),
}));

const tagStub = {
  name: 'Tag',
  props: ['tag', 'active', 'dataTestid', 'hideIcon', 'large'],
  emits: ['click'],
  template: '<button :data-active="active" @click="$emit(\'click\')">{{ tag }}</button>',
};

const mountShortcuts = () =>
  mount(OnlineInPersonShortcuts, {
    global: { stubs: { Tag: tagStub, TagComponent: tagStub } },
  });

const tags = (w: ReturnType<typeof mount>) => w.findAllComponents(tagStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { forumId: 'cats' }, query: {} };
});

describe('OnlineInPersonShortcuts rendering', () => {
  it('renders both location shortcuts', () => {
    const wrapper = mountShortcuts();

    expect(tags(wrapper)).toHaveLength(2);
  });

  it('formats the shortcut label without underscores', () => {
    const wrapper = mountShortcuts();

    expect(tags(wrapper)[0].props('tag')).not.toContain('_');
  });

  it('marks the active shortcut from the route query', () => {
    h.route = {
      params: { forumId: 'cats' },
      query: { locationFilter: LocationFilterTypes.ONLY_VIRTUAL },
    };
    const wrapper = mountShortcuts();

    expect(tags(wrapper)[0].props('active')).toBe(true);
  });
});

describe('OnlineInPersonShortcuts interactions', () => {
  it('applies a location filter when an inactive shortcut is clicked', async () => {
    const wrapper = mountShortcuts();

    await tags(wrapper)[0].vm.$emit('click');

    expect(h.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          locationFilter: LocationFilterTypes.ONLY_VIRTUAL,
        }),
      })
    );
  });

  it('clears the location filter when the active shortcut is clicked', async () => {
    h.route = {
      params: { forumId: 'cats' },
      query: { locationFilter: LocationFilterTypes.ONLY_VIRTUAL },
    };
    const wrapper = mountShortcuts();

    await tags(wrapper)[0].vm.$emit('click');

    const lastQuery = h.replace.mock.calls.at(-1)?.[0]?.query ?? {};
    expect(lastQuery.locationFilter).toBeUndefined();
  });
});
