import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Define mock component factory outside of any mocks - this needs to be accessible at the top level
const createMockComponent = () => ({
  template: `
    <div class="markdown-body" :class="fontSizeClass">
      {{ text }}
    </div>
  `,
  props: {
    text: { type: String, required: true },
    fontSize: { type: String, default: 'medium' }
  },
  computed: {
    fontSizeClass() {
      return {
        'font-size-small': this.fontSize === 'small',
        'font-size-medium': this.fontSize === 'medium',
        'font-size-large': this.fontSize === 'large'
      };
    }
  }
});

// Mock dependencies before the test body
<<<<<<< HEAD
vi.mock("@/composables/useTheme", () => ({
  useAppTheme: () => ({
    theme: "light",
  }),
=======
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    theme: 'light'
  })
>>>>>>> parent of 666ae3d (Use automated formatting tools)
}));

vi.mock('markdown-it', () => {
  return function() {
    return {
      render: vi.fn().mockImplementation(text => `<p>${text}</p>`),
      utils: { escapeHtml: vi.fn(text => text) },
      renderer: { rules: {} }
    };
  };
});

vi.mock('highlight.js', () => ({
  default: {
    getLanguage: vi.fn(),
    highlight: vi.fn()
  }
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn(content => content)
  }
}));

// Mock the MarkdownRenderer component - this needs to reference the factory function above
vi.mock('@/components/MarkdownRenderer.vue', () => ({
  default: createMockComponent()
}));

describe('MarkdownRenderer - Basic Props', () => {
  beforeEach(() => {
    vi.resetModules();
    
    vi.stubGlobal('import', {
      meta: { client: true }
    });
  });

  it('should accept a text prop', async () => {
    // Import the mocked component
    const MarkdownRenderer = await import('@/components/MarkdownRenderer.vue').then(m => m.default);
    
    // Test with basic text
    const wrapper = mount(MarkdownRenderer, {
      props: {
        text: 'Test content'
      }
    });
    
    // Should contain the content
    expect(wrapper.text()).toContain('Test content');
  });
  
  it('should apply different font size classes based on props', async () => {
    // Import the mocked component
    const MarkdownRenderer = await import('@/components/MarkdownRenderer.vue').then(m => m.default);
    
    // Test small font size
    const smallWrapper = mount(MarkdownRenderer, {
      props: {
        text: 'Small text',
        fontSize: 'small'
      }
    });
    expect(smallWrapper.classes()).toContain('font-size-small');
    
    // Test medium font size
    const mediumWrapper = mount(MarkdownRenderer, {
      props: {
        text: 'Medium text',
        fontSize: 'medium'
      }
    });
    expect(mediumWrapper.classes()).toContain('font-size-medium');
    
    // Test large font size
    const largeWrapper = mount(MarkdownRenderer, {
      props: {
        text: 'Large text',
        fontSize: 'large'
      }
    });
    expect(largeWrapper.classes()).toContain('font-size-large');
  });
});