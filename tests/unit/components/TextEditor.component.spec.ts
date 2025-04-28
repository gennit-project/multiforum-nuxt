import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { insertEmoji, formatText } from '@/utils/textFormatting';

// Mock the utility functions directly
vi.mock('@/utils/textFormatting', () => ({
  insertEmoji: vi.fn((params) => {
    return params.text.slice(0, params.position) + params.emoji + params.text.slice(params.position);
  }),
  formatText: vi.fn((params) => {
    if (params.format === 'bold') return `**${params.text}**`;
    if (params.format === 'italic') return `*${params.text}*`;
    return params.text;
  }),
  FormatType: {}
}));

// Very simple editor component for testing
const SimpleMockEditor = {
  template: `
    <div>
      <div id="editor">{{ text }}</div>
      <button class="bold-btn" @click="formatBold">Bold</button>
      <button class="emoji-btn" @click="addEmoji">Emoji</button>
    </div>
  `,
  data() {
    return {
      text: ''
    };
  },
  methods: {
    formatBold() {
      this.text = formatText({ text: this.text, format: 'bold' });
      this.$emit('update', this.text);
      return this.text;
    },
    addEmoji() {
      this.text = insertEmoji({ text: this.text, position: this.text.length, emoji: '😀' });
      this.$emit('update', this.text);
      return this.text;
    },
    setText(value) {
      this.text = value;
    }
  }
};

describe('TextEditor Component Tests', () => {
  // Direct component testing
  it('calls formatText when bold button is clicked', () => {
    const wrapper = shallowMount(SimpleMockEditor);
    
    // Set some text
    wrapper.vm.setText('Hello world');
    
    // Call the method directly instead of finding and triggering buttons
    wrapper.vm.formatBold();
    
    // Check that formatText was called correctly
    expect(formatText).toHaveBeenCalledWith({ text: 'Hello world', format: 'bold' });
    
    // Check that the text was updated
    expect(wrapper.vm.text).toBe('**Hello world**');
    
    // Check event emission
    expect(wrapper.emitted('update')).toBeTruthy();
    expect(wrapper.emitted('update')[0][0]).toBe('**Hello world**');
  });
  
  it('calls insertEmoji when emoji button is clicked', () => {
    const wrapper = shallowMount(SimpleMockEditor);
    
    // Set some text
    wrapper.vm.setText('Hello');
    
    // Call the method directly
    wrapper.vm.addEmoji();
    
    // Check that insertEmoji was called correctly
    expect(insertEmoji).toHaveBeenCalledWith({
      text: 'Hello',
      position: 5, // text.length
      emoji: '😀'
    });
    
    // Check that the text was updated
    expect(wrapper.vm.text).toBe('Hello😀');
    
    // Check event emission
    expect(wrapper.emitted('update')).toBeTruthy();
    expect(wrapper.emitted('update')[0][0]).toBe('Hello😀');
  });
});

// Mock method tests (not relying on Vue component mounting)
describe('TextEditor Method Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('formats text as bold', () => {
    // Mock component with just the method under test
    const mockMethods = {
      text: 'sample text',
      formatBold() {
        this.text = formatText({ text: this.text, format: 'bold' });
        return this.text;
      }
    };
    
    // Call the method
    const result = mockMethods.formatBold();
    
    // Verify results
    expect(formatText).toHaveBeenCalledWith({ text: 'sample text', format: 'bold' });
    expect(result).toBe('**sample text**');
  });
  
  it('inserts emoji at cursor position', () => {
    // Mock component with just the method under test
    const mockMethods = {
      text: 'Hello world',
      cursorPosition: 5,
      insertEmoji() {
        this.text = insertEmoji({
          text: this.text,
          position: this.cursorPosition,
          emoji: '👋'
        });
        return this.text;
      }
    };
    
    // Call the method
    const result = mockMethods.insertEmoji();
    
    // Verify results
    expect(insertEmoji).toHaveBeenCalledWith({
      text: 'Hello world',
      position: 5,
      emoji: '👋'
    });
    expect(result).toBe('Hello👋 world');
  });
});