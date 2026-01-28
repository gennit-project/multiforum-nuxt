import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DateTime } from 'luxon';

describe('defaultEventFormValues', () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    process.env.TZ = originalTZ;
  });

  it.each([
    {
      name: 'includes channel id when provided',
      channelId: 'channel-123',
      expected: ['channel-123'],
    },
    {
      name: 'uses empty array when channel id is empty',
      channelId: '',
      expected: [],
    },
  ])('$name', async ({ channelId, expected }) => {
    const { default: getDefaultEventFormValues } =
      await import('@/utils/defaultEventFormValues');

    const result = getDefaultEventFormValues(channelId);

    expect(result.selectedChannels).toEqual(expected);
  });

  it('sets startTime to the next hour', async () => {
    const { default: getDefaultEventFormValues } =
      await import('@/utils/defaultEventFormValues');

    const result = getDefaultEventFormValues('');
    const expectedStart = DateTime.fromJSDate(new Date())
      .startOf('hour')
      .plus({ hours: 1 })
      .toISO();

    expect(result.startTime).toBe(expectedStart);
  });

  it('sets endTime to two hours after startTime', async () => {
    const { default: getDefaultEventFormValues } =
      await import('@/utils/defaultEventFormValues');

    const result = getDefaultEventFormValues('');
    const expectedStart = DateTime.fromJSDate(new Date())
      .startOf('hour')
      .plus({ hours: 1 });
    const expectedEnd = expectedStart.plus({ hours: 2 }).toISO();

    expect(result.endTime).toBe(expectedEnd);
  });
});
