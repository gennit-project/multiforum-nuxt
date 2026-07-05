import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { FilterMode } from '@/__generated__/graphql';
import type { FilterGroup, FilterOption } from '@/__generated__/graphql';

import FilterOptionManager from '@/components/filter/FilterOptionManager.vue';

const makeOption = (overrides: Partial<FilterOption> = {}): FilterOption =>
  ({
    id: 'o1',
    value: '10x20',
    displayName: '10 x 20',
    order: 0,
    __typename: 'FilterOption',
    ...overrides,
  }) as unknown as FilterOption;

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
  }) as unknown as FilterGroup;

const mountOM = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(FilterOptionManager, {
    props: { filterGroup: makeGroup(), groupIndex: 1, ...props },
  });

const byText = (wrapper: ReturnType<typeof mountOM>, text: string) =>
  wrapper.findAll('button').find((b) => b.text() === text)!;

describe('FilterOptionManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'confirm', {
      configurable: true,
      value: vi.fn(() => true),
    });
  });

  it('renders the group index in the header', () => {
    const wrapper = mountOM({ groupIndex: 3 });
    expect(wrapper.text()).toContain('Group #3');
  });

  it('shows the mode label in read mode', () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({ mode: FilterMode.Exclude }),
    });
    expect(wrapper.text()).toContain('Must exclude selected labels');
  });

  it('emits moveGroup up when Move Up is clicked', async () => {
    const wrapper = mountOM({ canMoveUp: true });
    await byText(wrapper, '↑ Move Up').trigger('click');
    expect(wrapper.emitted('moveGroup')?.[0]).toEqual(['g1', 'up']);
  });

  it('hides the Move Up button when canMoveUp is false', () => {
    const wrapper = mountOM({ canMoveUp: false });
    expect(
      wrapper.findAll('button').some((b) => b.text() === '↑ Move Up')
    ).toBe(false);
  });

  it('emits removeGroup when Remove Group is clicked', async () => {
    const wrapper = mountOM();
    await byText(wrapper, 'Remove Group').trigger('click');
    expect(wrapper.emitted('removeGroup')?.[0]).toEqual(['g1']);
  });

  it('does not emit removeGroup when removal is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    const wrapper = mountOM();
    await byText(wrapper, 'Remove Group').trigger('click');
    expect(wrapper.emitted('removeGroup')).toBeUndefined();
  });

  it('reveals the edit form when Edit Group Settings is clicked', async () => {
    const wrapper = mountOM();
    await byText(wrapper, 'Edit Group Settings').trigger('click');
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('emits updateGroup with edited fields when saved', async () => {
    const wrapper = mountOM();
    await byText(wrapper, 'Edit Group Settings').trigger('click');
    await wrapper.get('input[type="text"]').setValue('new_key');
    await byText(wrapper, 'Save Changes').trigger('click');
    expect(wrapper.emitted('updateGroup')?.[0]?.[1]).toMatchObject({
      key: 'new_key',
    });
  });

  it('disables Save Changes for an invalid key', async () => {
    const wrapper = mountOM();
    await byText(wrapper, 'Edit Group Settings').trigger('click');
    await wrapper.get('input[type="text"]').setValue('bad key!');
    expect(
      byText(wrapper, 'Save Changes').attributes('disabled')
    ).toBeDefined();
  });

  it('leaves edit mode when cancelled', async () => {
    const wrapper = mountOM();
    await byText(wrapper, 'Edit Group Settings').trigger('click');
    await byText(wrapper, 'Cancel').trigger('click');
    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('shows the empty-options state when there are no options', () => {
    const wrapper = mountOM();
    expect(wrapper.text()).toContain(
      'No options configured. Add at least one option before saving this group.'
    );
  });

  it('emits updateGroup with the new option when added', async () => {
    const wrapper = mountOM();
    await byText(wrapper, '+ Add New Option').trigger('click');
    await wrapper.get('input[placeholder="e.g. 10x20"]').setValue('5x5');
    await wrapper.get('input[placeholder="e.g. 10 × 20"]').setValue('5 by 5');
    await byText(wrapper, 'Add Option').trigger('click');
    const payload = wrapper.emitted('updateGroup')?.[0]?.[1] as {
      options: FilterOption[];
    };
    expect(payload.options).toHaveLength(1);
  });

  it('reveals inline fields when editing an existing option', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({ options: [makeOption({ id: 'o1' })] }),
    });
    await byText(wrapper, 'Edit').trigger('click');
    expect(
      wrapper
        .findAll('input')
        .filter((input) => !input.attributes('placeholder'))
    ).toHaveLength(2);
  });

  it('emits updateGroup with edited option fields when saved', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({ options: [makeOption({ id: 'o1' })] }),
    });
    await byText(wrapper, 'Edit').trigger('click');
    const editInputs = wrapper
      .findAll('input')
      .filter((input) => !input.attributes('placeholder'));
    await editInputs[0]!.setValue('20x20');
    await editInputs[1]!.setValue('20 x 20');
    await byText(wrapper, 'Save').trigger('click');
    const payload = wrapper.emitted('updateGroup')?.[0]?.[1] as {
      options: FilterOption[];
    };
    expect(payload.options[0]).toMatchObject({
      id: 'o1',
      value: '20x20',
      displayName: '20 x 20',
    });
  });

  it('blocks saving an edited option when its value duplicates another option', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({
        options: [
          makeOption({ id: 'o1', value: '10x20' }),
          makeOption({ id: 'o2', value: '5x5' }),
        ],
      }),
    });
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')!
      .trigger('click');
    const editInputs = wrapper
      .findAll('input')
      .filter((input) => !input.attributes('placeholder'));
    await editInputs[0]!.setValue('5x5');
    expect(wrapper.text()).toContain(
      'This value already exists in this group.'
    );
    expect(byText(wrapper, 'Save').attributes('disabled')).toBeDefined();
  });

  it('flags a duplicate option value', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({ options: [makeOption({ value: '5x5' })] }),
    });
    await byText(wrapper, '+ Add New Option').trigger('click');
    await wrapper.get('input[placeholder="e.g. 10x20"]').setValue('5x5');
    expect(wrapper.text()).toContain(
      'This value already exists in this group.'
    );
  });

  it('flags an option value with invalid characters', async () => {
    const wrapper = mountOM();
    await byText(wrapper, '+ Add New Option').trigger('click');
    await wrapper.get('input[placeholder="e.g. 10x20"]').setValue('bad value');
    expect(wrapper.text()).toContain(
      'Value can only contain letters, numbers, underscores, and hyphens.'
    );
    expect(byText(wrapper, 'Add Option').attributes('disabled')).toBeDefined();
  });

  it('emits updateGroup with the option removed', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({
        options: [
          makeOption({ id: 'o1' }),
          makeOption({ id: 'o2', value: 'x' }),
        ],
      }),
    });
    await byText(wrapper, 'Remove').trigger('click');
    const payload = wrapper.emitted('updateGroup')?.[0]?.[1] as {
      options: FilterOption[];
    };
    expect(payload.options.map((o) => o.id)).toEqual(['o2']);
  });

  it('does not remove an option when removal is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    const wrapper = mountOM({
      filterGroup: makeGroup({ options: [makeOption({ id: 'o1' })] }),
    });
    await byText(wrapper, 'Remove').trigger('click');
    expect(wrapper.emitted('updateGroup')).toBeUndefined();
  });

  it('reorders options when moved down', async () => {
    const wrapper = mountOM({
      filterGroup: makeGroup({
        options: [
          makeOption({ id: 'o1' }),
          makeOption({ id: 'o2', value: 'x' }),
        ],
      }),
    });
    await wrapper.get('button[title="Move down"]').trigger('click');
    const payload = wrapper.emitted('updateGroup')?.[0]?.[1] as {
      options: FilterOption[];
    };
    expect(payload.options.map((o) => o.id)).toEqual(['o2', 'o1']);
  });
});
