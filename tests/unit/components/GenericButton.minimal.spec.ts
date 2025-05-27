import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Focus on testing the core button functionality without relying 
// on specific class names or DOM structure
describe('GenericButton Component - Minimal Tests', () => {
  beforeEach(() => {
    vi.resetModules();
    
    // Mock LoadingSpinner component correctly
    vi.mock('@/components/LoadingSpinner.vue', () => ({
      default: {
        name: 'LoadingSpinner',
        template: '<div class="mock-spinner">Loading...</div>'
      }
    }));
  });
  
  it('should render with text prop', async () => {
    const GenericButton = await import('@/components/GenericButton.vue').then(m => m.default);
    
    const wrapper = mount(GenericButton, {
      props: {
        text: 'Test Button'
      },
      global: {
        stubs: {
          LoadingSpinner: {
            template: '<div class="mock-spinner">Loading...</div>'
          }
        }
      }
    });
    
    // Button should have the text
    expect(wrapper.text()).toContain('Test Button');
    
    // Should emit click event when clicked
    await wrapper.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('click');
  });
  
  it('should show loading spinner when loading prop is true', async () => {
    const GenericButton = await import('@/components/GenericButton.vue').then(m => m.default);
    
    const wrapper = mount(GenericButton, {
      props: {
        text: 'Loading Button',
        loading: true
      },
      global: {
        stubs: {
          LoadingSpinner: {
            template: '<div class="mock-spinner">Loading...</div>'
          }
        }
      }
    });
    
    // Should contain the loading spinner
    expect(wrapper.html()).toContain('mock-spinner');
  });
  
  it('should support slot content', async () => {
    const GenericButton = await import('@/components/GenericButton.vue').then(m => m.default);
    
    const slotContent = '<span data-testid="custom-content">Custom Content</span>';
    
    const wrapper = mount(GenericButton, {
      props: {
        // Add required text prop to fix warning
        text: 'Button With Slot'
      },
      slots: {
        default: slotContent
      },
      global: {
        stubs: {
          LoadingSpinner: {
            template: '<div class="mock-spinner">Loading...</div>'
          }
        }
      }
    });
    
    // Should render slot content
    expect(wrapper.find('[data-testid="custom-content"]').exists()).toBe(true);
  });
});