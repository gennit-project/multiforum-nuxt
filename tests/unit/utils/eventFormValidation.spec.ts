import { describe, it, expect } from 'vitest';
import {
  eventFormNeedsChanges,
  getEventFormValidationMessage,
  type EventFormValidationInput,
} from '@/utils/eventFormValidation';

const validInput = (
  overrides: Partial<EventFormValidationInput> = {}
): EventFormValidationInput => ({
  selectedChannelsCount: 1,
  title: 'My Event',
  description: 'A description',
  virtualEventUrl: '',
  urlIsValid: true,
  startBeforeEnd: true,
  ...overrides,
});

describe('eventFormNeedsChanges', () => {
  it('is false for a fully valid form', () => {
    expect(eventFormNeedsChanges(validInput())).toBe(false);
  });

  it('is true when no channel is selected', () => {
    expect(
      eventFormNeedsChanges(validInput({ selectedChannelsCount: 0 }))
    ).toBe(true);
  });

  it('is true when the title is empty', () => {
    expect(eventFormNeedsChanges(validInput({ title: '' }))).toBe(true);
  });

  it('is true when the start is not before the end', () => {
    expect(
      eventFormNeedsChanges(validInput({ startBeforeEnd: false }))
    ).toBe(true);
  });

  it('is true when a virtual url is present but invalid', () => {
    expect(
      eventFormNeedsChanges(
        validInput({ virtualEventUrl: 'not-a-url', urlIsValid: false })
      )
    ).toBe(true);
  });

  it('is false when there is no virtual url even if urlIsValid is false', () => {
    expect(
      eventFormNeedsChanges(
        validInput({ virtualEventUrl: '', urlIsValid: false })
      )
    ).toBe(false);
  });
});

describe('getEventFormValidationMessage', () => {
  it('returns no message for a valid form', () => {
    expect(getEventFormValidationMessage(validInput())).toBe('');
  });

  it('asks for a channel first', () => {
    expect(
      getEventFormValidationMessage(validInput({ selectedChannelsCount: 0 }))
    ).toBe('At least one channel must be selected.');
  });

  it('asks for a title when missing', () => {
    expect(getEventFormValidationMessage(validInput({ title: '' }))).toBe(
      'A title is required.'
    );
  });

  it('flags an over-long title', () => {
    expect(
      getEventFormValidationMessage(validInput({ title: 'a'.repeat(200) }))
    ).toContain('Title cannot exceed');
  });

  it('flags an invalid virtual url', () => {
    expect(
      getEventFormValidationMessage(
        validInput({ virtualEventUrl: 'x', urlIsValid: false })
      )
    ).toBe('Virtual event URL must be valid.');
  });
});
