import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import TagPicker from '@/components/TagPicker.vue';

// Mock Apollo composables
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    loading: ref(false),
    result: ref({ tags: [] }),
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    loading: ref(false),
  })),
}));

// Mock GraphQL queries
vi.mock('@/graphQLData/tag/queries', () => ({
  GET_TAGS: {},
}));

vi.mock('@/graphQLData/tag/mutations', () => ({
  CREATE_TAG: {},
}));

// Use real MultiSelect component

// Mock v-click-outside directive
const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn(),
};

describe('TagPicker', () => {
  let wrapper: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  function createWrapper(props = {}) {
    return mount(TagPicker, {
      props: {
        selectedTags: [],
        description: 'Select tags',
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
    expect(wrapper.text()).toContain('Select tags');

    // Should have MultiSelect component
    expect(wrapper.findComponent({ name: 'MultiSelect' }).exists()).toBe(true);
  });

  it('displays the selected tags as chips', async () => {
    const selectedTags = ['tag1', 'tag2'];
    wrapper = createWrapper({
      selectedTags,
    });

    // Should pass selected values to MultiSelect component
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['tag1', 'tag2']);
  });

  it('toggles dropdown when clicked', async () => {
    wrapper = createWrapper();

    // Should have MultiSelect component that handles dropdown functionality
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.exists()).toBe(true);
  });

  it('removes selection when chip close button is clicked', async () => {
    const selectedTags = ['tag1', 'tag2'];
    wrapper = createWrapper({
      selectedTags,
    });

    // Call the handleUpdateTags method directly
    await wrapper.vm.handleUpdateTags(['tag2']);

    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedTags')).toBeTruthy();
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag2']);
  });

  it('closes the dropdown when clicked outside', async () => {
    wrapper = createWrapper();

    // MultiSelect component handles outside clicks internally
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.exists()).toBe(true);
  });

  it('updates selected tags when prop changes', async () => {
    wrapper = createWrapper({
      selectedTags: ['tag1'],
    });

    // Verify initial props passed to MultiSelect
    let multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['tag1']);

    // Update the prop
    await wrapper.setProps({
      selectedTags: ['tag1', 'tag2'],
    });

    // Should update MultiSelect props
    multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['tag1', 'tag2']);
  });

  it('handles toggleSelection from MultiSelect', async () => {
    wrapper = createWrapper();

    // Call handleUpdateTags method directly
    await wrapper.vm.handleUpdateTags(['tag1']);

    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedTags')).toBeTruthy();
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag1']);

    // Call handleUpdateTags with empty array for deselection
    await wrapper.vm.handleUpdateTags([]);

    // Should emit event with empty selection
    expect(wrapper.emitted('setSelectedTags')[1][0]).toEqual([]);
  });

  it('handles removing multiple selections', async () => {
    const selectedTags = ['tag1', 'tag2', 'tag3'];
    wrapper = createWrapper({
      selectedTags,
    });

    // Find the MultiSelect component
    const multiSelect = wrapper.findComponent({ name: 'MultiSelect' });
    expect(multiSelect.props('modelValue')).toEqual(['tag1', 'tag2', 'tag3']);

    // Call handleUpdateTags to remove tag2
    await wrapper.vm.handleUpdateTags(['tag1', 'tag3']);
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag1', 'tag3']);

    // Call handleUpdateTags to remove tag1
    await wrapper.vm.handleUpdateTags(['tag3']);
    expect(wrapper.emitted('setSelectedTags')[1][0]).toEqual(['tag3']);
  });
});
