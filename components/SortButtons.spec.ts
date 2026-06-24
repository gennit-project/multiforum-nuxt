import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import SortButtons from '@/components/SortButtons.vue';
import { availableSortTypes } from '@/components/comments/getSortFromQuery';

const h = vi.hoisted(() => ({ route: null as unknown, push: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));

const dropdownStub = {
  name: 'TextButtonDropdown',
  props: ['label', 'items', 'showSortIcon'],
  emits: ['clicked-item'],
  template: '<button class="dropdown">{{ label }}</button>',
};

const mountButtons = (props: Record<string, unknown> = {}) =>
  mount(SortButtons, {
    props,
    global: { stubs: { TextButtonDropdown: dropdownStub } },
  });

const dropdowns = (w: ReturnType<typeof mount>) => w.findAllComponents(dropdownStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { query: {} };
});

describe('SortButtons', () => {
  it('renders the sort dropdown', () => {
    const wrapper = mountButtons();

    expect(dropdowns(wrapper).length).toBeGreaterThanOrEqual(1);
  });

  it('pushes the chosen sort to the route', async () => {
    const wrapper = mountButtons();

    await dropdowns(wrapper)[0].vm.$emit('clicked-item', 'new');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ sort: 'new' }) })
    );
  });

  it('hides the time-frame dropdown for non-top sorts', () => {
    const wrapper = mountButtons();

    expect(dropdowns(wrapper)).toHaveLength(1);
  });

  it('shows the time-frame dropdown when sorting by Top', () => {
    h.route = { query: { sort: availableSortTypes.TOP } };
    const wrapper = mountButtons();

    expect(dropdowns(wrapper)).toHaveLength(2);
  });

  it('pushes the chosen time frame to the route', async () => {
    h.route = { query: { sort: availableSortTypes.TOP } };
    const wrapper = mountButtons();

    await dropdowns(wrapper)[1].vm.$emit('clicked-item', 'top_week');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ timeFrame: 'top_week' }) })
    );
  });

  it('hides the time-frame dropdown when showTopOptions is false', () => {
    h.route = { query: { sort: availableSortTypes.TOP } };
    const wrapper = mountButtons({ showTopOptions: false });

    expect(dropdowns(wrapper)).toHaveLength(1);
  });
});
