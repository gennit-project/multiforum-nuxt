import { describe, it, expect } from 'vitest';
import {
  eventFormNeedsChanges,
  getEventFormValidationMessage,
  type EventFormValidationInput,
} from './eventFormValidation';

const valid: EventFormValidationInput = {
  selectedChannelsCount: 1,
  title: 'My Event',
  description: 'desc',
  virtualEventUrl: null,
  urlIsValid: true,
  startBeforeEnd: true,
};

describe('eventFormNeedsChanges', () => {
  it('is false for a fully valid form', () => {
    expect(eventFormNeedsChanges(valid)).toBe(false);
  });

  it('is true when no channel is selected', () => {
    expect(eventFormNeedsChanges({ ...valid, selectedChannelsCount: 0 })).toBe(true);
  });

  it('is true when the start is not before the end', () => {
    expect(eventFormNeedsChanges({ ...valid, startBeforeEnd: false })).toBe(true);
  });

  it('is true when a virtual URL is present but invalid', () => {
    expect(
      eventFormNeedsChanges({
        ...valid,
        virtualEventUrl: 'bad',
        urlIsValid: false,
      })
    ).toBe(true);
  });
});

describe('getEventFormValidationMessage', () => {
  it('asks for a channel when none is selected', () => {
    expect(
      getEventFormValidationMessage({ ...valid, selectedChannelsCount: 0 })
    ).toBe('At least one channel must be selected.');
  });

  it('asks for a title when missing', () => {
    expect(getEventFormValidationMessage({ ...valid, title: '' })).toBe(
      'A title is required.'
    );
  });

  it('rejects an invalid virtual URL', () => {
    expect(
      getEventFormValidationMessage({
        ...valid,
        virtualEventUrl: 'bad',
        urlIsValid: false,
      })
    ).toBe('Virtual event URL must be valid.');
  });

  it('returns an empty string for a valid form', () => {
    expect(getEventFormValidationMessage(valid)).toBe('');
  });
});
