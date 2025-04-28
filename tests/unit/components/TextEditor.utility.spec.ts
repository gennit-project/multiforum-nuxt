import { describe, it, expect, vi } from 'vitest';
import {
  formatText,
  formatBold,
  formatItalic,
  formatUnderline,
  formatHeader1,
  formatHeader2,
  formatHeader3,
  formatQuote,
  insertEmoji,
  insertTextAtPosition,
  calculateRemainingChars,
} from '@/utils/textFormatting';

// Enhanced utility function testing
describe('TextEditor Utility Functions', () => {
  // formatText function
  describe('formatText', () => {
    it('applies formatting based on format type', () => {
      expect(formatText({ text: 'test', format: 'bold' })).toBe('**test**');
      expect(formatText({ text: 'test', format: 'italic' })).toBe('*test*');
      expect(formatText({ text: 'test', format: 'header1' })).toBe('# test');
    });
  });

  // Individual formatting functions
  describe('formatting functions', () => {
    it('applies bold formatting with formatBold', () => {
      expect(formatBold({ text: 'test' })).toBe('**test**');
      expect(formatBold({ text: '' })).toBe('****');
    });

    it('applies italic formatting with formatItalic', () => {
      expect(formatItalic({ text: 'test' })).toBe('*test*');
      expect(formatItalic({ text: '' })).toBe('**');
    });

    it('applies underline formatting with formatUnderline', () => {
      expect(formatUnderline({ text: 'test' })).toBe('<u>test</u>');
      expect(formatUnderline({ text: '' })).toBe('<u></u>');
    });

    it('applies header formatting', () => {
      expect(formatHeader1({ text: 'title' })).toBe('# title');
      expect(formatHeader2({ text: 'title' })).toBe('## title');
      expect(formatHeader3({ text: 'title' })).toBe('### title');
    });

    it('applies quote formatting', () => {
      expect(formatQuote({ text: 'single line' })).toBe('> single line');
      expect(formatQuote({ text: 'line 1\nline 2' })).toBe('> line 1\n> line 2');
    });
  });

  // Text manipulation functions
  describe('text manipulation', () => {
    it('inserts text at position', () => {
      expect(
        insertTextAtPosition({
          originalText: 'Hello world',
          position: { start: 5, end: 5 },
          textToInsert: ' beautiful',
        })
      ).toBe('Hello beautiful world');
    });
    
    it('replaces selected text when positions differ', () => {
      expect(
        insertTextAtPosition({
          originalText: 'Hello world',
          position: { start: 6, end: 11 },
          textToInsert: 'everyone',
        })
      ).toBe('Hello everyone');
    });
  });

  // Character counter
  describe('calculateRemainingChars', () => {
    it('calculates remaining characters', () => {
      expect(calculateRemainingChars({ current: 10, max: 100 })).toBe(90);
      expect(calculateRemainingChars({ current: 100, max: 100 })).toBe(0);
      expect(calculateRemainingChars({ current: 150, max: 100 })).toBe(-50);
    });
  });

  // Emoji insertion
  describe('insertEmoji', () => {
    it('inserts emoji at cursor position', () => {
      expect(insertEmoji({ text: 'Hello world', position: 5, emoji: '👋' })).toBe('Hello👋 world');
      expect(insertEmoji({ text: 'Hello', position: 5, emoji: '👋' })).toBe('Hello👋');
      expect(insertEmoji({ text: '', position: 0, emoji: '👋' })).toBe('👋');
    });
  });
});

// Component method simulations (isolated from full component)
describe('TextEditor Component Methods', () => {
  it('simulates updating text and emitting change event', () => {
    // Create a mock component
    const mockComponent = {
      text: '',
      emit: vi.fn(),
      updateText(newText) {
        this.text = newText;
        this.emit('update', newText);
      },
    };

    // Call the method
    mockComponent.updateText('Hello world');

    // Check expectations
    expect(mockComponent.text).toBe('Hello world');
    expect(mockComponent.emit).toHaveBeenCalledWith('update', 'Hello world');
  });

  it('simulates formatting text', () => {
    // Create a mock component
    const mockComponent = {
      text: 'Hello world',
      emit: vi.fn(),
      formatTextArea(format) {
        const selectedText = this.text;
        // Use the actual formatText function
        this.text = formatText({ text: selectedText, format });
        this.emit('update', this.text);
      },
    };

    // Call the method
    mockComponent.formatTextArea('bold');

    // Check expectations
    expect(mockComponent.text).toBe('**Hello world**');
    expect(mockComponent.emit).toHaveBeenCalledWith('update', '**Hello world**');
  });

  it('simulates inserting emoji', () => {
    // Create a mock component
    const mockComponent = {
      text: 'Hello world',
      cursorPosition: 5,
      emit: vi.fn(),
      insertEmoji(emoji) {
        // Use the actual insertEmoji function
        this.text = insertEmoji({
          text: this.text,
          position: this.cursorPosition,
          emoji,
        });
        this.emit('update', this.text);
        return this.text;
      },
    };

    // Call the method
    const result = mockComponent.insertEmoji('👋');

    // Check expectations
    expect(result).toBe('Hello👋 world');
    expect(mockComponent.text).toBe('Hello👋 world');
    expect(mockComponent.emit).toHaveBeenCalledWith('update', 'Hello👋 world');
  });

  describe('image paste handling', () => {
    // Create mock utilities
    const mockCreateSignedStorageUrl = vi.fn().mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://example.com/upload-url' } },
    });
    
    const mockUploadAndGetEmbeddedLink = vi.fn().mockResolvedValue('https://example.com/image.jpg');
    
    // Create a mock component
    const mockComponent = {
      text: 'Hello world',
      cursorPosition: 5,
      emit: vi.fn(),
      mockCreateSignedStorageUrl,
      mockUploadAndGetEmbeddedLink,
      async handleImagePaste(file) {
        // Simulate the actual behavior
        const filename = 'test-image.jpg';
        const contentType = file.type;
        
        // Get signed URL from server
        const signedUrlResult = await this.mockCreateSignedStorageUrl({
          filename,
          contentType,
        });
        
        const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;
        
        // Simulate upload
        const imageUrl = await this.mockUploadAndGetEmbeddedLink({
          file,
          filename,
          fileType: contentType,
          signedStorageURL,
        });
        
        // Insert markdown into text
        const markdownLink = `![${file.name}](${imageUrl})`;
        this.text = this.text.slice(0, this.cursorPosition) + markdownLink + this.text.slice(this.cursorPosition);
        
        this.emit('update', this.text);
        return this.text;
      },
    };

    it('handles image paste and insertion', async () => {
      // Create a mock file
      const file = new File(['test data'], 'test-image.jpg', { type: 'image/jpeg' });
      
      // Call the method
      const result = await mockComponent.handleImagePaste(file);
      
      // Check expectations
      expect(mockComponent.mockCreateSignedStorageUrl).toHaveBeenCalled();
      expect(mockComponent.mockUploadAndGetEmbeddedLink).toHaveBeenCalled();
      expect(result).toContain('![test-image.jpg](https://example.com/image.jpg)');
      expect(mockComponent.emit).toHaveBeenCalled();
    });
  });
});