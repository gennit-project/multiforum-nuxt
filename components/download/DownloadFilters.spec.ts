import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import CheckBox from '@/components/CheckBox.vue';
import MultiSelect from '@/components/MultiSelect.vue';
import { sims4PackPreferenceFilterGroups } from '@/tests/playwright/helpers/sims4DownloadFixtures';

import DownloadFilters from '@/components/download/DownloadFilters.vue';

const route = createMockRoute();
const router = createMockRouter();
vi.mock('nuxt/app', () => ({
  useRoute: () => route,
  useRouter: () => router,
}));

const group = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'g1',
    key: 'type',
    displayName: 'File Type',
    options: [
      { id: 'o1', value: 'pdf', displayName: 'PDF' },
      { id: 'o2', value: 'zip', displayName: 'ZIP' },
    ],
    ...overrides,
  }) as never;

const manyOptions = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `o${i}`,
    value: `v${i}`,
    displayName: `Option ${i}`,
  }));

const mountFilters = (filterGroups: unknown[]) =>
  mountWithDefaults(DownloadFilters, {
    props: { filterGroups } as Record<string, unknown>,
    global: { stubs: { CheckBox: true, MultiSelect: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  route.query = {};
});

describe('DownloadFilters', () => {
  it('renders a header and a checkbox per option for a small group', () => {
    const wrapper = mountFilters([group()]);
    expect(wrapper.text()).toContain('File Type');
    expect(wrapper.findAllComponents(CheckBox)).toHaveLength(2);
  });

  it('shows the empty state when there are no filter groups', () => {
    expect(mountFilters([]).text()).toContain('No filters configured');
  });

  it('uses a MultiSelect dropdown for groups with 10+ options', () => {
    const wrapper = mountFilters([group({ options: manyOptions(10) })]);
    expect(wrapper.findComponent(MultiSelect).exists()).toBe(true);
    expect(wrapper.findComponent(CheckBox).exists()).toBe(false);
  });

  it('adds a selected option to the route query when toggled on', async () => {
    const wrapper = mountFilters([group()]);
    await wrapper.findAllComponents(CheckBox)[0].vm.$emit('update');
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ filter_type: 'pdf' }),
      })
    );
  });

  it('writes the joined selection from a MultiSelect update', async () => {
    const wrapper = mountFilters([group({ options: manyOptions(10) })]);
    await wrapper
      .findComponent(MultiSelect)
      .vm.$emit('update:model-value', ['v1', 'v2']);
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ filter_type: 'v1,v2' }),
      })
    );
  });

  it('writes paired Sims pack include and exclude selections to the route query', async () => {
    const wrapper = mountFilters(sims4PackPreferenceFilterGroups);
    const multiselects = wrapper.findAllComponents(MultiSelect);
    await multiselects[0].vm.$emit('update:model-value', ['vampires']);
    await multiselects[1].vm.$emit('update:model-value', ['dine_out']);
    expect(router.replace).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          filter_include_game_packs: 'vampires',
          filter_exclude_game_packs: 'dine_out',
        }),
      })
    );
  });

  describe('with active filters from the query', () => {
    it('shows the active count in the clear-all button', () => {
      route.query = { filter_type: 'pdf,zip' };
      const wrapper = mountFilters([group()]);
      expect(wrapper.text()).toContain('Clear all (2)');
    });

    it('clears every filter group when clear-all is clicked', async () => {
      route.query = { filter_type: 'pdf' };
      const wrapper = mountFilters([group()]);
      await wrapper.get('button').trigger('click');
      expect(router.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          // updateFilters drops keys whose value is undefined, so the query is
          // emptied of the filter param.
          query: expect.not.objectContaining({ filter_type: expect.anything() }),
        })
      );
    });

    it('hides the clear-all button when nothing is selected', () => {
      const wrapper = mountFilters([group()]);
      expect(wrapper.text()).not.toContain('Clear all');
    });
  });
});
