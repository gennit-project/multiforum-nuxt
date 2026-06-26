import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import getDefaultEventFormValues from './defaultEventFormValues';

describe('getDefaultEventFormValues', () => {
  it('seeds selectedChannels with the given channel id', () => {
    expect(getDefaultEventFormValues('cats').selectedChannels).toEqual(['cats']);
  });

  it('leaves selectedChannels empty when no channel id is given', () => {
    expect(getDefaultEventFormValues('').selectedChannels).toEqual([]);
  });

  it('defaults the end time to two hours after the start time', () => {
    const values = getDefaultEventFormValues('cats');
    const diff = DateTime.fromISO(values.endTime)
      .diff(DateTime.fromISO(values.startTime), 'hours')
      .toObject();
    expect(diff.hours).toBe(2);
  });

  it('defaults to a non-all-day single-date event', () => {
    expect(getDefaultEventFormValues('cats').dateMode).toBe('single');
  });
});
