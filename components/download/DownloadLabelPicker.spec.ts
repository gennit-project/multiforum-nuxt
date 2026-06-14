import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadLabelPicker from './DownloadLabelPicker.vue';
import type { FilterGroup } from '@/__generated__/graphql';

const mockFilterGroups: FilterGroup[] = [
  {
    id: 'group-1',
    key: 'category',
    displayName: 'Category',
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
  it('displays filter group names', () => {
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
    expect(wrapper.text()).toContain('License Type');
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

    // All options from both groups should be visible
    expect(wrapper.text()).toContain('Tools');
    expect(wrapper.text()).toContain('Models');
    expect(wrapper.text()).toContain('Textures');
    expect(wrapper.text()).toContain('Free');
    expect(wrapper.text()).toContain('Commercial');
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

    // Should show total count of selected labels
    expect(wrapper.text()).toContain('3 selected');
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

  it('shows header and description', () => {
    const wrapper = mount(DownloadLabelPicker, {
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

    expect(wrapper.text()).toContain('Download Labels');
    expect(wrapper.text()).toContain(
      'Select labels to help users find your download'
    );
  });
});
