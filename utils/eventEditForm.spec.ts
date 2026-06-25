import { describe, it, expect } from 'vitest';
import { buildEventEditFormValues } from './eventEditForm';

describe('buildEventEditFormValues', () => {
  it('maps the title and times', () => {
    const values = buildEventEditFormValues({
      title: 'Meetup',
      startTime: '2024-01-01T18:00:00Z',
      endTime: '2024-01-01T20:00:00Z',
    });
    expect(values).toMatchObject({
      title: 'Meetup',
      startTime: '2024-01-01T18:00:00Z',
      endTime: '2024-01-01T20:00:00Z',
    });
  });

  it('maps tags to their text', () => {
    expect(
      buildEventEditFormValues({ Tags: [{ text: 'music' }, { text: 'art' }] })
        .selectedTags
    ).toEqual(['music', 'art']);
  });

  it('maps event channels to their unique names', () => {
    expect(
      buildEventEditFormValues({
        EventChannels: [{ channelUniqueName: 'cats' }],
      }).selectedChannels
    ).toEqual(['cats']);
  });

  it('preserves the canceled flag', () => {
    expect(buildEventEditFormValues({ canceled: true }).canceled).toBe(true);
  });

  it('defaults optional fields', () => {
    const values = buildEventEditFormValues({});
    expect(values).toMatchObject({
      title: '',
      description: '',
      selectedTags: [],
      selectedChannels: [],
      free: false,
      isAllDay: false,
      canceled: false,
      dateMode: 'single',
      occurrences: [],
    });
  });

  it('always starts in single-date mode with no recurrence', () => {
    const values = buildEventEditFormValues({ title: 'X' });
    expect(values.repeatPattern).toBeUndefined();
  });
});
