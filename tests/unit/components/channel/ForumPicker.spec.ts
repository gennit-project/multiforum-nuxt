import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ForumPicker from '@/components/channel/ForumPicker.vue'

// Mock components used in ForumPicker
vi.mock('@/components/channel/SearchableForumList.vue', () => ({
  default: {
    name: 'SearchableForumList',
    props: ['selectedChannels'],
    template: '<div class="mocked-forum-list" data-testid="forum-list"></div>',
    emits: ['toggleSelection', 'setChannelOptions'],
  }
}))

vi.mock('@/components/AvatarComponent.vue', () => ({
  default: {
    name: 'AvatarComponent',
    props: ['src', 'text'],
    template: '<div class="mocked-avatar"></div>'
  }
}))

// Mock v-click-outside directive
const clickOutsideDirective = {
  mounted: vi.fn(),
  unmounted: vi.fn()
}

describe('ForumPicker', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  function createWrapper(props = {}) {
    return mount(ForumPicker, {
      props: {
        selectedChannels: [],
        description: 'Select forums',
        testId: 'forum-picker',
        ...props
      },
      global: {
        directives: {
          'click-outside': clickOutsideDirective
        },
        stubs: {
          SearchableForumList: true,
          AvatarComponent: true
        },
      }
    })
  }

  it('renders correctly with default props', () => {
    wrapper = createWrapper()
    
    // Check for description
    expect(wrapper.text()).toContain('Select forums')
    
    // Should not initially show the SearchableForumList
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(false)
  })

  it('displays the selected channels as chips', async () => {
    const selectedChannels = ['forum1', 'forum2']
    wrapper = createWrapper({
      selectedChannels
    })

    // Directly emit the setChannelOptions event from SearchableForumList
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    const forumList = wrapper.findComponent({ name: 'SearchableForumList' })
    await forumList.vm.$emit('setChannelOptions', [
      { uniqueName: 'forum1', channelIconURL: 'icon1.png' },
      { uniqueName: 'forum2', channelIconURL: 'icon2.png' }
    ])

    // Should have two chips for selected forums
    const chips = wrapper.findAll('.flex.items-center.rounded-full')
    expect(chips.length).toBe(2)

    // Should show forum names in the chips
    expect(chips[0].text()).toContain('forum1')
    expect(chips[1].text()).toContain('forum2')
  })

  it('toggles dropdown when clicked', async () => {
    wrapper = createWrapper()
    
    // Initial state: dropdown closed
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(false)
    
    // Click to open dropdown
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(true)
    
    // Click again to close dropdown
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(false)
  })

  it('removes selection when chip close button is clicked', async () => {
    const selectedChannels = ['forum1', 'forum2']
    wrapper = createWrapper({
      selectedChannels
    })
    
    // Directly emit the setChannelOptions event from SearchableForumList
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    const forumList = wrapper.findComponent({ name: 'SearchableForumList' })
    await forumList.vm.$emit('setChannelOptions', [
      { uniqueName: 'forum1', channelIconURL: 'icon1.png' },
      { uniqueName: 'forum2', channelIconURL: 'icon2.png' }
    ])
    
    // Close the dropdown
    await wrapper.vm.outside()
    
    // Click the × on the first chip
    const chips = wrapper.findAll('.flex.items-center.rounded-full')
    await chips[0].find('.cursor-pointer').trigger('click')
    
    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedChannels')).toBeTruthy()
    expect(wrapper.emitted('setSelectedChannels')[0][0]).toEqual(['forum2'])
  })

  it('closes the dropdown when clicked outside', async () => {
    wrapper = createWrapper()
    
    // Open the dropdown
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(true)
    
    // Simulate outside click by directly calling the outside method
    await wrapper.vm.outside()
    
    // Dropdown should now be closed
    expect(wrapper.findComponent({ name: 'SearchableForumList' }).exists()).toBe(false)
  })

  it('updates selected channels when prop changes', async () => {
    wrapper = createWrapper({
      selectedChannels: ['forum1']
    })
    
    // Verify initial selection
    expect(wrapper.vm.selected).toEqual(['forum1'])
    
    // Update the prop
    await wrapper.setProps({
      selectedChannels: ['forum1', 'forum2']
    })
    
    // Should update the internal selection
    expect(wrapper.vm.selected).toEqual(['forum1', 'forum2'])
  })

  it('handles toggleSelection from SearchableForumList', async () => {
    wrapper = createWrapper()
    
    // Open dropdown
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    
    // Find the SearchableForumList component
    const forumList = wrapper.findComponent({ name: 'SearchableForumList' })
    
    // Simulate selection toggle from SearchableForumList
    await forumList.vm.$emit('toggleSelection', 'forum1')
    
    // Should emit event with updated selection
    expect(wrapper.emitted('setSelectedChannels')).toBeTruthy()
    expect(wrapper.emitted('setSelectedChannels')[0][0]).toEqual(['forum1'])
    
    // Simulate toggle of same forum to deselect
    await forumList.vm.$emit('toggleSelection', 'forum1')
    
    // Should emit event with empty selection
    expect(wrapper.emitted('setSelectedChannels')[1][0]).toEqual([])
  })

  it('receives channel options from SearchableForumList', async () => {
    wrapper = createWrapper()
    
    // Open dropdown
    await wrapper.find('[data-testid="forum-picker"]').trigger('click')
    
    const channelOptions = [
      { uniqueName: 'forum1', channelIconURL: 'icon1.png' },
      { uniqueName: 'forum2', channelIconURL: 'icon2.png' }
    ]
    
    // Find the SearchableForumList component
    const forumList = wrapper.findComponent({ name: 'SearchableForumList' })
    
    // Simulate receiving channel options
    await forumList.vm.$emit('setChannelOptions', channelOptions)
    
    // Should update the channelOptions
    expect(wrapper.vm.channelOptions).toEqual(channelOptions)
  })
})