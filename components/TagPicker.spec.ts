import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TagPicker from '@/components/TagPicker.vue'

// Mock components used in TagPicker
vi.mock('@/components/SearchableTagList.vue', () => ({
  default: {
    name: 'SearchableTagList',
    props: ['selectedTags'],
    template: '<div class="mocked-tag-list" data-testid="tag-list"></div>',
    emits: ['toggleSelection'],
  }
}))

// Mock v-click-outside directive
const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn()
}

describe('TagPicker', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(TagPicker, {
      props: {
        selectedTags: [],
        description: 'Select tags',
        ...props
      },
      global: {
        directives: {
          'click-outside': clickOutsideDirective
        },
        stubs: {
          SearchableTagList: true
        },
      }
    })
  }

  it('renders correctly with default props', () => {
    wrapper = createWrapper()
    
    // Check for description
    expect(wrapper.text()).toContain('Select tags')
    
    // Should not initially show the SearchableTagList
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(false)
    
    // Should show "There are no tags yet" when no tags selected
    expect(wrapper.text()).toContain('There are no tags yet')
  })

  it('displays the selected tags as chips', async () => {
    const selectedTags = ['tag1', 'tag2']
    wrapper = createWrapper({
      selectedTags
    })

    // Should have two chips for selected tags
    const chips = wrapper.findAll('.inline-flex.items-center.rounded-full')
    expect(chips.length).toBe(2)

    // Should show tag names in the chips
    expect(chips[0].text()).toContain('tag1')
    expect(chips[1].text()).toContain('tag2')
    
    // Should not show "There are no tags yet" when tags are selected
    expect(wrapper.text()).not.toContain('There are no tags yet')
  })

  it('toggles dropdown when clicked', async () => {
    wrapper = createWrapper()
    
    // Initial state: dropdown closed
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(false)
    
    // Click to open dropdown
    await wrapper.find('[data-testid="tag-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(true)
    
    // Click again to close dropdown
    await wrapper.find('[data-testid="tag-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(false)
  })

  it('removes selection when chip close button is clicked', async () => {
    const selectedTags = ['tag1', 'tag2']
    wrapper = createWrapper({
      selectedTags
    })
    
    // Click the × on the first chip
    const chips = wrapper.findAll('.inline-flex.items-center.rounded-full')
    await chips[0].find('.cursor-pointer').trigger('click')
    
    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedTags')).toBeTruthy()
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag2'])
  })

  it('closes the dropdown when clicked outside', async () => {
    wrapper = createWrapper()
    
    // Open the dropdown
    await wrapper.find('[data-testid="tag-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(true)
    
    // Simulate outside click by directly calling the outside method
    await wrapper.vm.outside()
    
    // Dropdown should now be closed
    expect(wrapper.findComponent({ name: 'SearchableTagList' }).exists()).toBe(false)
  })

  it('updates selected tags when prop changes', async () => {
    wrapper = createWrapper({
      selectedTags: ['tag1']
    })
    
    // Verify initial selection
    expect(wrapper.vm.selected).toEqual(['tag1'])
    
    // Update the prop
    await wrapper.setProps({
      selectedTags: ['tag1', 'tag2']
    })
    
    // Should update the internal selection
    expect(wrapper.vm.selected).toEqual(['tag1', 'tag2'])
  })

  it('handles toggleSelection from SearchableTagList', async () => {
    wrapper = createWrapper()
    
    // Open dropdown
    await wrapper.find('[data-testid="tag-picker"]').trigger('click')
    
    // Find the SearchableTagList component
    const tagList = wrapper.findComponent({ name: 'SearchableTagList' })
    
    // Simulate selection toggle from SearchableTagList
    await tagList.vm.$emit('toggleSelection', 'tag1')
    
    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedTags')).toBeTruthy()
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag1'])
    
    // Simulate toggle of same tag to deselect
    await tagList.vm.$emit('toggleSelection', 'tag1')
    
    // Should emit event with empty selection
    expect(wrapper.emitted('setSelectedTags')[1][0]).toEqual([])
  })

  it('handles removing multiple selections', async () => {
    const selectedTags = ['tag1', 'tag2', 'tag3']
    wrapper = createWrapper({
      selectedTags
    })
    
    // Find all the chips
    const chips = wrapper.findAll('.inline-flex.items-center.rounded-full')
    expect(chips.length).toBe(3)
    
    // Remove tag2
    await chips[1].find('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('setSelectedTags')[0][0]).toEqual(['tag1', 'tag3'])
    
    // Updated selection should be reflected in component
    await wrapper.setProps({ selectedTags: ['tag1', 'tag3'] })
    
    // Now remove tag1
    const updatedChips = wrapper.findAll('.inline-flex.items-center.rounded-full')
    await updatedChips[0].find('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('setSelectedTags')[1][0]).toEqual(['tag3'])
  })
})