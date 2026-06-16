import { describe, it, expect } from 'vitest';
import {
  discussionFormNeedsChanges,
  getDiscussionFormValidationMessage,
  type DiscussionFormValidationInput,
} from '@/utils/discussionFormValidation';

const validInput = (
  overrides: Partial<DiscussionFormValidationInput> = {}
): DiscussionFormValidationInput => ({
  selectedChannelsCount: 1,
  title: 'My Discussion',
  body: 'Some body text',
  ...overrides,
});

describe('discussionFormNeedsChanges', () => {
  it('is false for a valid form', () => {
    expect(discussionFormNeedsChanges(validInput())).toBe(false);
  });

  it('is true with no channel selected', () => {
    expect(
      discussionFormNeedsChanges(validInput({ selectedChannelsCount: 0 }))
    ).toBe(true);
  });

  it('is true with an empty title', () => {
    expect(discussionFormNeedsChanges(validInput({ title: '' }))).toBe(true);
  });

  it('is true when the title is over the limit', () => {
    expect(
      discussionFormNeedsChanges(validInput({ title: 'a'.repeat(200) }))
    ).toBe(true);
  });
});

describe('getDiscussionFormValidationMessage', () => {
  it('returns no message for a valid form', () => {
    expect(getDiscussionFormValidationMessage(validInput())).toBe('');
  });

  it('asks for a title first', () => {
    expect(getDiscussionFormValidationMessage(validInput({ title: '' }))).toBe(
      'A title is required.'
    );
  });

  it('asks for a forum when none selected', () => {
    expect(
      getDiscussionFormValidationMessage(
        validInput({ selectedChannelsCount: 0 })
      )
    ).toBe('Must select at least one forum.');
  });

  it('flags an over-long body', () => {
    expect(
      getDiscussionFormValidationMessage(
        validInput({ body: 'a'.repeat(18001) })
      )
    ).toContain('Body cannot exceed');
  });
});
