import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { FilterMode } from '@/__generated__/graphql';
import type { FilterGroup } from '@/__generated__/graphql';

import FilterGroupManager from '@/components/filter/FilterGroupManager.vue';

// The child manager is exercised by its own spec; stub it so these tests stay
// focused on FilterGroupManager's own add/remove/move/YAML logic. The stub
// re-emits the events the parent listens for.
const FilterOptionManagerStub = {
  name: 'FilterOptionManager',
  props: ['filterGroup', 'groupIndex', 'canMoveUp', 'canMoveDown', 'disabled', 'existingKeys'],
  emits: ['updateGroup', 'removeGroup', 'moveGroup'],
  template: '<div class="fom-stub" />',
};

const makeGroup = (overrides: Partial<FilterGroup> = {}): FilterGroup =>
  ({
    id: 'g1',
    key: 'lot_size',
    displayName: 'Lot Size',
    mode: FilterMode.Include,
    order: 0,
    options: [],
    __typename: 'FilterGroup',
    ...overrides,
  } as unknown as FilterGroup);

const mountManager = (filterGroups: FilterGroup[] = [], disabled = false) =>
  mountWithDefaults(FilterGroupManager, {
    props: { filterGroups, disabled },
    global: { stubs: { FilterOptionManager: FilterOptionManagerStub } },
  });

const openNewGroupForm = async (wrapper: ReturnType<typeof mountManager>) => {
  await wrapper.findAll('button').find((b) => b.text() === 'Add New Filter Group')!.trigger('click');
};

describe('FilterGroupManager', () => {
  it('shows the empty state when there are no groups', () => {
    const wrapper = mountManager([]);
    expect(wrapper.text()).toContain('No filter groups configured.');
  });

  it('renders one option manager per existing group', () => {
    const wrapper = mountManager([makeGroup(), makeGroup({ id: 'g2', key: 'color' })]);
    expect(wrapper.findAllComponents(FilterOptionManagerStub)).toHaveLength(2);
  });

  it('opens the new-group form when Add New Filter Group is clicked', async () => {
    const wrapper = mountManager([]);
    await openNewGroupForm(wrapper);
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('disables the Add Group button until key and display name are valid', async () => {
    const wrapper = mountManager([]);
    await openNewGroupForm(wrapper);
    const addBtn = wrapper.findAll('button').find((b) => b.text() === 'Add Group')!;
    expect(addBtn.attributes('disabled')).toBeDefined();
  });

  it('rejects a key with invalid characters', async () => {
    const wrapper = mountManager([]);
    await openNewGroupForm(wrapper);
    await wrapper.get('input[placeholder="e.g. lot_size"]').setValue('bad key!');
    expect(wrapper.text()).toContain('Key can only contain letters, numbers, and underscores.');
  });

  it('flags a duplicate key', async () => {
    const wrapper = mountManager([makeGroup({ id: 'g1', key: 'color' })]);
    await openNewGroupForm(wrapper);
    await wrapper.get('input[placeholder="e.g. lot_size"]').setValue('color');
    expect(wrapper.text()).toContain('This key is already used by another filter group.');
  });

  it('emits updateFilterGroups with the new group when added', async () => {
    const wrapper = mountManager([]);
    await openNewGroupForm(wrapper);
    await wrapper.get('input[placeholder="e.g. lot_size"]').setValue('lot_size');
    await wrapper.get('input[placeholder="e.g. Lot Size"]').setValue('Lot Size');
    await wrapper.findAll('button').find((b) => b.text() === 'Add Group')!.trigger('click');
    expect(wrapper.emitted('updateFilterGroups')?.[0]?.[0]).toHaveLength(1);
  });

  it('emits the filtered list when a group is removed', () => {
    const wrapper = mountManager([makeGroup({ id: 'g1' }), makeGroup({ id: 'g2', key: 'color' })]);
    wrapper.findAllComponents(FilterOptionManagerStub)[0].vm.$emit('removeGroup', 'g1');
    const emitted = wrapper.emitted('updateFilterGroups')?.[0]?.[0] as FilterGroup[];
    expect(emitted.map((g) => g.id)).toEqual(['g2']);
  });

  it('applies an updated group field when a child requests it', () => {
    const wrapper = mountManager([makeGroup({ id: 'g1', displayName: 'Old' })]);
    wrapper.findComponent(FilterOptionManagerStub).vm.$emit('updateGroup', 'g1', { displayName: 'New' });
    const emitted = wrapper.emitted('updateFilterGroups')?.[0]?.[0] as FilterGroup[];
    expect(emitted[0].displayName).toBe('New');
  });

  it('reorders groups when a child requests a move down', () => {
    const wrapper = mountManager([makeGroup({ id: 'g1' }), makeGroup({ id: 'g2', key: 'color' })]);
    wrapper.findAllComponents(FilterOptionManagerStub)[0].vm.$emit('moveGroup', 'g1', 'down');
    const emitted = wrapper.emitted('updateFilterGroups')?.[0]?.[0] as FilterGroup[];
    expect(emitted.map((g) => g.id)).toEqual(['g2', 'g1']);
  });

  it('switches to the YAML editor and serializes the current groups', async () => {
    const wrapper = mountManager([makeGroup({ id: 'g1', key: 'lot_size' })]);
    await wrapper.findAll('button').find((b) => b.text() === 'YAML Editor')!.trigger('click');
    expect(wrapper.get('textarea').element.value).toContain('lot_size');
  });

  it('shows a YAML error when applying invalid YAML', async () => {
    const wrapper = mountManager([]);
    await wrapper.findAll('button').find((b) => b.text() === 'YAML Editor')!.trigger('click');
    await wrapper.get('textarea').setValue('not: [valid yaml');
    await wrapper.findAll('button').find((b) => b.text() === 'Apply Changes')!.trigger('click');
    expect(wrapper.text()).toContain('YAML Error:');
  });
});
