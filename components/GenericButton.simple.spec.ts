import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// This simple test focuses on just the core functionality of the button

// Hoisted to the top of the module by Vitest, so it must live at the top level.
vi.mock('@/components/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div class="mock-spinner">Loading...</div>',
  },
}));

describe('GenericButton Component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should render text and handle click events', async () => {
    const GenericButton = await import('@/components/GenericButton.vue').then(
      (m) => m.default
    );

    const wrapper = mount(GenericButton, {
      props: {
        text: 'Test Button',
      },
      global: {
        stubs: {
          // Ensure LoadingSpinner is stubbed in the mount options too
          LoadingSpinner: {
            template: '<div class="mock-spinner">Loading...</div>',
          },
        },
      },
    });

    // Button should render the text
    expect(wrapper.text()).toContain('Test Button');

    // Button should emit click events
    await wrapper.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('click');
  });
});
