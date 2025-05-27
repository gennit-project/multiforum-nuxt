import { describe, it, expect } from 'vitest';
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
  type FormatType
} from '@/utils/textFormatting';

describe('Text Formatting Utilities', () => {
  // Comprehensive formatting function tests
  describe('formatText', () => {
    it('formats text with different format types', () => {
      const testCases: Array<{ format: FormatType; input: string; expected: string }> = [
        { format: 'bold', input: 'test', expected: '**test**' },
        { format: 'italic', input: 'test', expected: '*test*' },
        { format: 'underline', input: 'test', expected: '<u>test</u>' },
        { format: 'header1', input: 'test', expected: '# test' },
        { format: 'header2', input: 'test', expected: '## test' },
        { format: 'header3', input: 'test', expected: '### test' },
        { format: 'quote', input: 'test', expected: '> test' },
      ];

      testCases.forEach(({ format, input, expected }) => {
        expect(formatText({ text: input, format })).toBe(expected);
      });
    });
    
    it('handles empty input', () => {
      expect(formatText({ text: '', format: 'bold' })).toBe('****');
      expect(formatText({ text: '', format: 'italic' })).toBe('**');
      expect(formatText({ text: '', format: 'header1' })).toBe('# ');
    });
    
    it('handles invalid format type', () => {
      // @ts-expect-error Testing with invalid format
      expect(formatText({ text: 'test', format: 'invalid' })).toBe('test');
    });
  });

  // Individual formatting function tests
  describe('Individual formatting functions', () => {
    // Bold formatting
    describe('formatBold', () => {
      it('adds markdown bold markers to text', () => {
        expect(formatBold({ text: 'test' })).toBe('**test**');
      });
      
      it('handles empty string', () => {
        expect(formatBold({ text: '' })).toBe('****');
      });
      
      it('preserves whitespace', () => {
        expect(formatBold({ text: ' test with spaces ' })).toBe('** test with spaces **');
      });
    });
    
    // Italic formatting
    describe('formatItalic', () => {
      it('adds markdown italic markers to text', () => {
        expect(formatItalic({ text: 'test' })).toBe('*test*');
      });
      
      it('handles empty string', () => {
        expect(formatItalic({ text: '' })).toBe('**');
      });
    });
    
    // Underline formatting
    describe('formatUnderline', () => {
      it('adds HTML underline tags to text', () => {
        expect(formatUnderline({ text: 'test' })).toBe('<u>test</u>');
      });
      
      it('handles empty string', () => {
        expect(formatUnderline({ text: '' })).toBe('<u></u>');
      });
    });
    
    // Header formatting
    describe('header formatting', () => {
      it('formats headers with correct level', () => {
        expect(formatHeader1({ text: 'header' })).toBe('# header');
        expect(formatHeader2({ text: 'header' })).toBe('## header');
        expect(formatHeader3({ text: 'header' })).toBe('### header');
      });
      
      it('adds space after hash', () => {
        expect(formatHeader1({ text: '' })).toBe('# ');
        expect(formatHeader2({ text: '' })).toBe('## ');
        expect(formatHeader3({ text: '' })).toBe('### ');
      });
    });
    
    // Quote formatting
    describe('formatQuote', () => {
      it('adds quote marker to single line', () => {
        expect(formatQuote({ text: 'quoted text' })).toBe('> quoted text');
      });
      
      it('adds quote marker to each line in multiline text', () => {
        const input = 'line 1\nline 2\nline 3';
        const expected = '> line 1\n> line 2\n> line 3';
        expect(formatQuote({ text: input })).toBe(expected);
      });
      
      it('handles empty string', () => {
        expect(formatQuote({ text: '' })).toBe('> ');
      });
      
      it('preserves empty lines', () => {
        const input = 'line 1\n\nline 3';
        const expected = '> line 1\n> \n> line 3';
        expect(formatQuote({ text: input })).toBe(expected);
      });
    });
  });
  
  // Text insertion tests
  describe('insertTextAtPosition', () => {
    it('inserts text at specified position', () => {
      const result = insertTextAtPosition({
        originalText: 'Hello world',
        position: { start: 5, end: 5 },
        textToInsert: ' beautiful'
      });
      
      expect(result).toBe('Hello beautiful world');
    });
    
    it('replaces text when start and end positions differ', () => {
      const result = insertTextAtPosition({
        originalText: 'Hello world',
        position: { start: 6, end: 11 },
        textToInsert: 'everyone'
      });
      
      expect(result).toBe('Hello everyone');
    });
    
    it('handles insertion at beginning of text', () => {
      const result = insertTextAtPosition({
        originalText: 'world',
        position: { start: 0, end: 0 },
        textToInsert: 'Hello '
      });
      
      expect(result).toBe('Hello world');
    });
    
    it('handles insertion at end of text', () => {
      const result = insertTextAtPosition({
        originalText: 'Hello',
        position: { start: 5, end: 5 },
        textToInsert: ' world'
      });
      
      expect(result).toBe('Hello world');
    });
    
    it('handles empty original text', () => {
      const result = insertTextAtPosition({
        originalText: '',
        position: { start: 0, end: 0 },
        textToInsert: 'New text'
      });
      
      expect(result).toBe('New text');
    });
  });
  
  // Character counter tests
  describe('calculateRemainingChars', () => {
    it('calculates remaining characters correctly', () => {
      expect(calculateRemainingChars({ current: 0, max: 100 })).toBe(100);
      expect(calculateRemainingChars({ current: 50, max: 100 })).toBe(50);
      expect(calculateRemainingChars({ current: 100, max: 100 })).toBe(0);
    });
    
    it('returns negative values when over limit', () => {
      expect(calculateRemainingChars({ current: 150, max: 100 })).toBe(-50);
    });
  });
  
  // Emoji insertion tests
  describe('insertEmoji', () => {
    it('inserts emoji at specified position', () => {
      expect(insertEmoji({ text: 'Hello world', position: 5, emoji: '👋' })).toBe('Hello👋 world');
    });
    
    it('handles emoji insertion at beginning of text', () => {
      expect(insertEmoji({ text: 'Hello', position: 0, emoji: '👋' })).toBe('👋Hello');
    });
    
    it('handles emoji insertion at end of text', () => {
      expect(insertEmoji({ text: 'Hello', position: 5, emoji: '👋' })).toBe('Hello👋');
    });
    
    it('handles empty text', () => {
      expect(insertEmoji({ text: '', position: 0, emoji: '👋' })).toBe('👋');
    });
    
    it('handles multi-character emoji', () => {
      // Some emoji (like family emoji) are composed of multiple code points
      const familyEmoji = '👨‍👩‍👧‍👦';
      expect(insertEmoji({ text: 'Family: ', position: 8, emoji: familyEmoji })).toBe('Family: 👨‍👩‍👧‍👦');
    });
    
    it('handles insertion between characters', () => {
      expect(insertEmoji({ text: 'HelloWorld', position: 5, emoji: '👋' })).toBe('Hello👋World');
    });
  });
});