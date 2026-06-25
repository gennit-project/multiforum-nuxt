import { describe, it, expect } from 'vitest';
import {
  discussionFormNeedsChanges,
  getDiscussionFormValidationMessage,
  type DiscussionFormValidationInput,
} from './discussionFormValidation';

const valid: DiscussionFormValidationInput = {
  selectedChannelsCount: 1,
  title: 'My Discussion',
  body: 'body',
};

describe('discussionFormNeedsChanges', () => {
  it('is false for a valid form', () => {
    expect(discussionFormNeedsChanges(valid)).toBe(false);
  });

  it('is true with no title', () => {
    expect(discussionFormNeedsChanges({ ...valid, title: '' })).toBe(true);
  });

  it('is true with no channel selected', () => {
    expect(discussionFormNeedsChanges({ ...valid, selectedChannelsCount: 0 })).toBe(
      true
    );
  });
});

describe('getDiscussionFormValidationMessage', () => {
  it('asks for a title first when missing', () => {
    expect(getDiscussionFormValidationMessage({ ...valid, title: '' })).toBe(
      'A title is required.'
    );
  });

  it('asks for a forum when none is selected', () => {
    expect(
      getDiscussionFormValidationMessage({ ...valid, selectedChannelsCount: 0 })
    ).toBe('Must select at least one forum.');
  });

  it('returns an empty string for a valid form', () => {
    expect(getDiscussionFormValidationMessage(valid)).toBe('');
  });
});
