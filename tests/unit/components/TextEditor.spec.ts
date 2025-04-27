import { describe, it, expect } from 'vitest'
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
  calculateRemainingChars 
} from '@/utils/textFormatting'
import { isFileSizeValid } from '@/utils/index'

// Test the text formatting functions
describe('TextEditor formatting functions', () => {
  it('formats text as bold correctly', () => {
    expect(formatBold({ text: 'sample text' })).toBe('**sample text**')
    expect(formatText({ text: 'sample text', format: 'bold' })).toBe('**sample text**')
  })

  it('formats text as italic correctly', () => {
    expect(formatItalic({ text: 'sample text' })).toBe('*sample text*')
    expect(formatText({ text: 'sample text', format: 'italic' })).toBe('*sample text*')
  })

  it('formats text as underline correctly', () => {
    expect(formatUnderline({ text: 'sample text' })).toBe('<u>sample text</u>')
    expect(formatText({ text: 'sample text', format: 'underline' })).toBe('<u>sample text</u>')
  })

  it('formats text as header 1 correctly', () => {
    expect(formatHeader1({ text: 'sample text' })).toBe('# sample text')
    expect(formatText({ text: 'sample text', format: 'header1' })).toBe('# sample text')
  })

  it('formats text as header 2 correctly', () => {
    expect(formatHeader2({ text: 'sample text' })).toBe('## sample text')
    expect(formatText({ text: 'sample text', format: 'header2' })).toBe('## sample text')
  })

  it('formats text as header 3 correctly', () => {
    expect(formatHeader3({ text: 'sample text' })).toBe('### sample text')
    expect(formatText({ text: 'sample text', format: 'header3' })).toBe('### sample text')
  })

  it('formats text as a quote correctly', () => {
    const input = 'line 1\nline 2'
    const expected = '> line 1\n> line 2'
    expect(formatQuote({ text: input })).toBe(expected)
    expect(formatText({ text: input, format: 'quote' })).toBe(expected)
  })

  it('handles empty text correctly', () => {
    expect(formatBold({ text: '' })).toBe('****')
    expect(formatItalic({ text: '' })).toBe('**')
    expect(formatHeader1({ text: '' })).toBe('# ')
  })

  it('handles multi-line text correctly', () => {
    const multilineText = 'First line\nSecond line\nThird line'
    
    // Bold should wrap the entire text
    expect(formatBold({ text: multilineText })).toBe('**First line\nSecond line\nThird line**')
    
    // Quote should prefix each line
    expect(formatQuote({ text: multilineText })).toBe('> First line\n> Second line\n> Third line')
  })
})

// Test the character counter logic
describe('CharCounter', () => {
  it('calculates characters remaining correctly', () => {
    expect(calculateRemainingChars({ current: 0, max: 500 })).toBe(500)
    expect(calculateRemainingChars({ current: 100, max: 500 })).toBe(400)
    expect(calculateRemainingChars({ current: 500, max: 500 })).toBe(0)
    expect(calculateRemainingChars({ current: 600, max: 500 })).toBe(-100)
  })
})

// Test the file size validation utility
describe('Image Upload Validation', () => {
  it('validates file size correctly', () => {
    // Mock small file (1MB)
    const smallFile = { size: 1 * 1024 * 1024 }
    expect(isFileSizeValid({ file: smallFile }).valid).toBe(true)
    
    // Mock large file (10MB)
    const largeFile = { size: 10 * 1024 * 1024 }
    expect(isFileSizeValid({ file: largeFile }).valid).toBe(false)
  })

  it('returns informative error messages', () => {
    const largeFile = { size: 10 * 1024 * 1024 }
    const result = isFileSizeValid({ file: largeFile })
    expect(result.valid).toBe(false)
    expect(result.message).toContain('must be less than')
  })
})

// Test emoji insertion logic
describe('Emoji Insertion', () => {
  it('inserts emoji at cursor position', () => {
    expect(insertEmoji({ text: 'Hello world', position: 5, emoji: '👋' })).toBe('Hello👋 world')
    expect(insertEmoji({ text: '', position: 0, emoji: '😊' })).toBe('😊')
  })

  it('handles emoji insertion at start and end of text', () => {
    expect(insertEmoji({ text: 'Hello world', position: 0, emoji: '👋' })).toBe('👋Hello world')
    expect(insertEmoji({ text: 'Hello world', position: 11, emoji: '👋' })).toBe('Hello world👋')
  })

  it('maintains cursor position after emoji insertion', () => {
    const originalText = 'Hello world'
    const emoji = '👋'
    const position = 5
    
    const result = insertEmoji({ text: originalText, position, emoji })
    
    // Function should not modify the original text directly
    expect(originalText).toBe('Hello world')
    
    // New text should have emoji inserted
    expect(result).toBe('Hello👋 world')
    
    // In real usage, cursor position would be updated to after the emoji
    // Note: Emoji length in JavaScript is often counted as more than 1 character
    // because they're represented by multiple UTF-16 code units
    const newCursorPosition = position + emoji.length
    expect(newCursorPosition).toBe(7) // Emoji "👋" has a length of 2 in JavaScript
  })
})