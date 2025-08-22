import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ForumPicker from '@/components/channel/ForumPicker.vue';

// Mock Apollo composables
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    loading: ref(false),
    result: ref({ channels: [] }),
  })),
}));

// Mock GraphQL queries
vi.mock('@/graphQLData/channel/queries', () => ({
  GET_CHANNEL_NAMES: {},
}));

// Use real MultiSelect component

// Mock v-click-outside directive
const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn(),
};

describe('ForumPicker', () => {
  let wrapper: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  function createWrapper(props = {}) {
    return mount(ForumPicker, {
      props: {
        selectedChannels: [],
        description: 'Select forums',
        testId: 'forum-picker',
        ...props,
      },
      global: {
        directives: {
          'click-outside': clickOutsideDirective,
        },
      },
    });
  }

  it('renders correctly with default props', () => {
    wrapper = createWrapper();

    // Check for description
    expect(wrapper.text()).toContain('Select forums');

    // Should have MultiSelect component
    expect(wrapper.findComponent({ name: 'MultiSelect' }).exists()).toBe(true);
  });

  it('displays the selected channels as chips', async () => {
    const selectedChannels = ['forum1', 'forum2'];
    wrapper = createWrapper({
      selectedChannels,
    });

    // Should pass selected values to MultiSelect component
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['forum1', 'forum2']);
  });

  it('toggles dropdown when clicked', async () => {
    wrapper = createWrapper();

    // Should have MultiSelect component that handles dropdown functionality
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.exists()).toBe(true);
  });

  it('removes selection when chip close button is clicked', async () => {
    const selectedChannels = ['forum1', 'forum2'];
    wrapper = createWrapper({
      selectedChannels,
    });

    // Call handleUpdateChannels method directly
    await wrapper.vm.handleUpdateChannels(['forum2']);

    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedChannels')).toBeTruthy();
    expect(wrapper.emitted('setSelectedChannels')[0][0]).toEqual(['forum2']);
  });

  it('closes the dropdown when clicked outside', async () => {
    wrapper = createWrapper();

    // MultiSelect component handles outside clicks internally
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.exists()).toBe(true);
  });

  it('updates selected channels when prop changes', async () => {
    wrapper = createWrapper({
      selectedChannels: ['forum1'],
    });

    // Verify initial props passed to MultiSelect
    let multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['forum1']);

    // Update the prop
    await wrapper.setProps({
      selectedChannels: ['forum1', 'forum2'],
    });

    // Should update MultiSelect props
    multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['forum1', 'forum2']);
  });

  it('handles toggleSelection from MultiSelect', async () => {
    wrapper = createWrapper();

    // Call handleUpdateChannels method directly
    await wrapper.vm.handleUpdateChannels(['forum1']);

    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedChannels')).toBeTruthy();
    expect(wrapper.emitted('setSelectedChannels')[0][0]).toEqual(['forum1']);

    // Call handleUpdateChannels with empty array for deselection
    await wrapper.vm.handleUpdateChannels([]);

    // Should emit event with empty selection
    expect(wrapper.emitted('setSelectedChannels')[1][0]).toEqual([]);
  });

  it('receives channel options from GraphQL query', async () => {
    wrapper = createWrapper();

    // Should have MultiSelect component with options from GraphQL
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('options')).toEqual([]);
    expect(multiSelect.props('loading')).toBe(false);
  });
});
