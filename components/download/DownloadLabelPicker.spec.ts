import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadLabelPicker from './DownloadLabelPicker.vue';
import { FilterSelection } from '@/__generated__/graphql';
import type { FilterGroup } from '@/__generated__/graphql';

const mockFilterGroups: FilterGroup[] = [
  {
    id: 'group-1',
    key: 'category',
    displayName: 'Category',
    uploadSelection: FilterSelection.Multiple,
    options: [
      {
        id: 'opt-1',
        value: 'tools',
        displayName: 'Tools',
        group: { key: 'category' },
      },
      {
        id: 'opt-2',
        value: 'models',
        displayName: 'Models',
        group: { key: 'category' },
      },
      {
        id: 'opt-3',
        value: 'textures',
        displayName: 'Textures',
        group: { key: 'category' },
      },
    ],
  },
  {
    id: 'group-2',
    key: 'license',
    displayName: 'License Type',
    uploadSelection: FilterSelection.Multiple,
    options: [
      {
        id: 'opt-4',
        value: 'free',
        displayName: 'Free',
        group: { key: 'license' },
      },
      {
        id: 'opt-5',
        value: 'commercial',
        displayName: 'Commercial',
        group: { key: 'license' },
      },
    ],
  },
] as FilterGroup[];

describe('DownloadLabelPicker', () => {
  it('displays non-license filter group names', () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template:
              '<div class="checkbox"><input type="checkbox" :checked="checked" /><span>{{ label }}</span></div>',
            props: ['checked', 'label'],
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Category');
  });

  it('hides the license filter group', () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template: '<div class="checkbox"><span>{{ label }}</span></div>',
            props: ['checked', 'label'],
          },
        },
      },
    });

    expect(wrapper.text()).not.toContain('License Type');
  });

  it('displays all options in small groups as checkboxes', () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template: '<div class="checkbox"><span>{{ label }}</span></div>',
            props: ['checked', 'label'],
          },
        },
      },
    });

    // All options from the visible group should be visible
    expect(wrapper.text()).toContain('Tools');
    expect(wrapper.text()).toContain('Models');
    expect(wrapper.text()).toContain('Textures');
  });

  it('shows selected count when labels are selected', () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {
          category: ['tools', 'models'],
          license: ['free'],
        },
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template: '<div class="checkbox" />',
            props: ['checked', 'label'],
          },
        },
      },
    });

    // License selections are preserved in data but omitted from the user-facing count.
    expect(wrapper.text()).toContain('2 selected');
  });

  it('emits update event when checkbox is toggled', async () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template: '<div class="checkbox" @click="$emit(\'update\')" />',
            props: ['checked', 'label'],
            emits: ['update'],
          },
        },
      },
    });

    // Click a checkbox
    const checkboxes = wrapper.findAll('.checkbox');
    await checkboxes[0].trigger('click');

    // Should emit update event
    expect(wrapper.emitted('update:selectedLabels')).toBeTruthy();
  });

  it('shows empty state when no filter groups configured', () => {
    const wrapper = mount(DownloadLabelPicker, {
      props: {
        filterGroups: [],
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: { template: '<div class="checkbox" />' },
        },
      },
    });

    expect(wrapper.text()).toContain(
      'No label categories configured for this forum'
    );
  });

  const mountWithGroups = () =>
    mount(DownloadLabelPicker, {
      props: {
        filterGroups: mockFilterGroups,
        selectedLabels: {},
      },
      global: {
        stubs: {
          MultiSelect: { template: '<div class="multi-select" />' },
          CheckBox: {
            template: '<div class="checkbox" />',
            props: ['checked', 'label'],
          },
        },
      },
    });

  it('shows the description', () => {
    expect(mountWithGroups().text()).toContain(
      'Select labels to help users find your download'
    );
  });

  it('leaves the section heading to the parent form row', () => {
    expect(mountWithGroups().find('h3').exists()).toBe(false);
  });

  it('groups each filter group in a fieldset named by its legend', () => {
    expect(
      mountWithGroups()
        .findAll('fieldset legend')
        .map((legend) => legend.text())
    ).toEqual(
      mockFilterGroups
        .filter((group) => group.key !== 'license')
        .map((group) => group.displayName)
    );
  });

  it('renders small single-choice groups as radios with a None option', () => {
    const wrapper = mountWithSingleGroup();

    expect(
      wrapper
        .findAll('input[type="radio"]')
        .map((radio) => radio.attributes('value'))
    ).toEqual(['', 'tools', 'models', 'textures']);
  });

  it('replaces a stale multi-value selection when a single-choice radio is selected', async () => {
    const wrapper = mountWithSingleGroup({ category: ['tools', 'models'] });

    await wrapper
      .get('input[type="radio"][value="textures"]')
      .trigger('change');

    expect(wrapper.emitted('update:selectedLabels')?.at(-1)?.[0]).toEqual({
      category: ['textures'],
    });
  });

  it('normalizes existing multi-value data when a group becomes single-choice', () => {
    const wrapper = mountWithSingleGroup({ category: ['tools', 'models'] });

    expect(wrapper.emitted('update:selectedLabels')?.[0]?.[0]).toEqual({
      category: ['tools'],
    });
  });

  it('clears a single-choice group when None is selected', async () => {
    const wrapper = mountWithSingleGroup({ category: ['tools'] });

    await wrapper.get('input[type="radio"][value=""]').trigger('change');

    expect(wrapper.emitted('update:selectedLabels')?.[0]?.[0]).toEqual({});
  });

  it('renders large single-choice groups as a native select with a clear option', () => {
    const wrapper = mountWithSingleGroup({}, 10);

    expect({
      selectCount: wrapper.findAll('select').length,
      firstOption: wrapper.get('select option').text(),
      multiSelectCount: wrapper.findAll('.multi-select').length,
    }).toEqual({ selectCount: 1, firstOption: 'None', multiSelectCount: 0 });
  });

  it('emits one value from a large single-choice select', async () => {
    const wrapper = mountWithSingleGroup({}, 10);

    await wrapper.get('select').setValue('option-7');

    expect(wrapper.emitted('update:selectedLabels')?.[0]?.[0]).toEqual({
      category: ['option-7'],
    });
  });
});

const mountWithSingleGroup = (
  selectedLabels: Record<string, string[]> = {},
  optionCount = 3
) =>
  mount(DownloadLabelPicker, {
    props: {
      filterGroups: [
        {
          ...mockFilterGroups[0],
          uploadSelection: FilterSelection.Single,
          options:
            optionCount === 3
              ? mockFilterGroups[0]!.options
              : Array.from({ length: optionCount }, (_, index) => ({
                  id: `option-${index}`,
                  value: `option-${index}`,
                  displayName: `Option ${index}`,
                })),
        } as FilterGroup,
      ],
      selectedLabels,
    },
    global: {
      stubs: {
        MultiSelect: { template: '<div class="multi-select" />' },
        CheckBox: { template: '<div class="checkbox" />' },
      },
    },
  });
