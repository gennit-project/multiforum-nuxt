import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  isFileSizeValid,
  getUploadFileName,
  encodeSpacesInURL,
  getDuration,
  getTagLabel,
  getLinksInText,
  getChannelLabel,
  checkUrl,
  isAlphaNumeric,
  timeAgo,
  stableRelativeTime,
  formatDuration,
  formatAbbreviatedDuration,
  uploadAndGetEmbeddedLink,
  durationHoursAndMinutes,
  getDurationObj,
  compareDate,
  getReadableTimeFromISO,
  convertTimeToReadableFormat,
  relativeTimeHoursAndMinutes,
  updateTagsInCache,
  getTimePieces,
  getDatePieces,
  relativeTime,
} from '@/utils/index';
import { DateTime } from 'luxon';
import type { Duration } from 'luxon';
import type { ApolloCache } from '@apollo/client/core';
import type { Event, Tag as TagData } from '@/__generated__/graphql';

describe('isFileSizeValid', () => {
  it('returns valid for file under 5MB', () => {
    const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg'); // ~1MB

    const result = isFileSizeValid({ file });

    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  it('returns invalid for file over 5MB', () => {
    const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg'); // ~6MB

    const result = isFileSizeValid({ file });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('less than 5MB');
  });

  it('uses 1MB limit for profile pics', () => {
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'profile.jpg'); // ~2MB

    const result = isFileSizeValid({ file, isProfilePic: true });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('less than 1MB');
  });

  it('returns valid for profile pic under 1MB', () => {
    const file = new File(['x'.repeat(512 * 1024)], 'profile.jpg'); // ~0.5MB

    const result = isFileSizeValid({ file, isProfilePic: true });

    expect(result.valid).toBe(true);
  });
});

describe('getUploadFileName', () => {
  it('includes timestamp, username, and filename', () => {
    const file = new File(['content'], 'myfile.jpg');
    const username = 'testuser';

    const result = getUploadFileName({ file, username });

    expect(result).toContain('testuser');
    expect(result).toContain('myfile.jpg');
    expect(result).toMatch(/^\d+-testuser-myfile\.jpg$/);
  });

  it('replaces spaces with underscores', () => {
    const file = new File(['content'], 'my file name.jpg');
    const username = 'test user';

    const result = getUploadFileName({ file, username });

    expect(result).not.toContain(' ');
    expect(result).toContain('test_user');
    expect(result).toContain('my_file_name.jpg');
  });
});

describe('encodeSpacesInURL', () => {
  it('encodes spaces as %20', () => {
    const result = encodeSpacesInURL('https://example.com/my file.jpg');

    expect(result).toBe('https://example.com/my%20file.jpg');
  });

  it('handles multiple spaces', () => {
    const result = encodeSpacesInURL('path with many spaces');

    expect(result).toBe('path%20with%20many%20spaces');
  });

  it('returns same string when no spaces', () => {
    const url = 'https://example.com/file.jpg';

    expect(encodeSpacesInURL(url)).toBe(url);
  });
});

describe('getDuration', () => {
  it('returns duration in hours and minutes format', () => {
    const result = getDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-01T11:30:00Z'
    );

    expect(result).toBe('1h 30m');
  });

  it('returns just hours when no minutes', () => {
    const result = getDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-01T12:00:00Z'
    );

    expect(result).toBe('2h ');
  });

  it('returns just minutes when under an hour', () => {
    const result = getDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-01T10:45:00Z'
    );

    expect(result).toBe('45m');
  });

  it('includes days for long durations', () => {
    const result = getDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-03T12:30:00Z'
    );

    expect(result).toContain('2d');
    expect(result).toContain('2h');
    expect(result).toContain('30m');
  });

  it('returns empty string when end is before start', () => {
    const result = getDuration(
      '2024-01-01T12:00:00Z',
      '2024-01-01T10:00:00Z'
    );

    expect(result).toBe('');
  });

  it('returns 0m for zero duration', () => {
    const result = getDuration(
      '2024-01-01T10:00:00Z',
      '2024-01-01T10:00:00Z'
    );

    expect(result).toBe('0m');
  });
});

describe('getTagLabel', () => {
  it('returns "Tags" for empty array', () => {
    expect(getTagLabel([])).toBe('Tags');
  });

  it('returns count for non-empty array', () => {
    expect(getTagLabel(['tag1', 'tag2'])).toBe('Tags (2)');
  });

  it('returns count of 1 for single tag', () => {
    expect(getTagLabel(['single'])).toBe('Tags (1)');
  });
});

describe('getLinksInText', () => {
  it('extracts http links from text', () => {
    const text = 'Check out http://example.com for more info';

    const result = getLinksInText(text);

    expect(result).toContain('http://example.com');
  });

  it('extracts https links from text', () => {
    const text = 'Visit https://secure.example.com/page';

    const result = getLinksInText(text);

    expect(result).toContain('https://secure.example.com/page');
  });

  it('extracts multiple links', () => {
    const text = 'Check https://one.com and https://two.com';

    const result = getLinksInText(text);

    expect(result).toHaveLength(2);
  });

  it('excludes image URLs', () => {
    const text = 'Image: https://example.com/photo.jpg';

    const result = getLinksInText(text);

    expect(result).toHaveLength(0);
  });

  it('excludes png image URLs', () => {
    const text = 'Image: https://example.com/photo.png';

    const result = getLinksInText(text);

    expect(result).toHaveLength(0);
  });

  it('excludes gif image URLs', () => {
    const text = 'Animation: https://example.com/anim.gif';

    const result = getLinksInText(text);

    expect(result).toHaveLength(0);
  });

  it('returns empty array for text without links', () => {
    expect(getLinksInText('No links here')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(getLinksInText('')).toEqual([]);
  });

  it('returns empty array for falsy input', () => {
    expect(getLinksInText(null as unknown as string)).toEqual([]);
  });
});

describe('getChannelLabel', () => {
  it('returns "All Forums" for empty array', () => {
    expect(getChannelLabel([])).toBe('All Forums');
  });

  it('returns count for selected forums', () => {
    expect(getChannelLabel(['forum1', 'forum2', 'forum3'])).toBe('Forums (3)');
  });
});

describe('checkUrl', () => {
  it('returns true for valid http URL', () => {
    expect(checkUrl('http://example.com')).toBe(true);
  });

  it('returns true for valid https URL', () => {
    expect(checkUrl('https://example.com')).toBe(true);
  });

  it('returns true for URL with path', () => {
    expect(checkUrl('https://example.com/path/to/page')).toBe(true);
  });

  it('returns true for URL with query string', () => {
    expect(checkUrl('https://example.com?foo=bar')).toBe(true);
  });

  it('returns true for URL with port', () => {
    expect(checkUrl('https://example.com:8080/path')).toBe(true);
  });

  it('returns false for missing protocol', () => {
    expect(checkUrl('example.com')).toBe(false);
  });

  it('returns false for invalid domain', () => {
    expect(checkUrl('https://')).toBe(false);
  });

  it('returns false for random text', () => {
    expect(checkUrl('not a url at all')).toBe(false);
  });
});

describe('isAlphaNumeric', () => {
  it('returns true for lowercase letters', () => {
    expect(isAlphaNumeric('abc')).toBe(true);
  });

  it('returns true for uppercase letters', () => {
    expect(isAlphaNumeric('ABC')).toBe(true);
  });

  it('returns true for numbers', () => {
    expect(isAlphaNumeric('123')).toBe(true);
  });

  it('returns true for mixed alphanumeric', () => {
    expect(isAlphaNumeric('abc123XYZ')).toBe(true);
  });

  it('returns false for spaces', () => {
    expect(isAlphaNumeric('abc 123')).toBe(false);
  });

  it('returns false for special characters', () => {
    expect(isAlphaNumeric('abc@123')).toBe(false);
  });

  it('returns false for hyphens', () => {
    expect(isAlphaNumeric('abc-123')).toBe(false);
  });

  it('returns true for empty string', () => {
    expect(isAlphaNumeric('')).toBe(true);
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for very recent dates', () => {
    const date = new Date('2024-06-15T11:59:30.000Z');

    expect(timeAgo(date)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const date = new Date('2024-06-15T11:50:00.000Z');

    expect(timeAgo(date)).toBe('10 minutes ago');
  });

  it('returns singular minute', () => {
    const date = new Date('2024-06-15T11:59:00.000Z');

    expect(timeAgo(date)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const date = new Date('2024-06-15T09:00:00.000Z');

    expect(timeAgo(date)).toBe('3 hours ago');
  });

  it('returns singular hour', () => {
    const date = new Date('2024-06-15T11:00:00.000Z');

    expect(timeAgo(date)).toBe('1 hour ago');
  });

  it('returns days ago', () => {
    const date = new Date('2024-06-13T12:00:00.000Z');

    expect(timeAgo(date)).toBe('2 days ago');
  });

  it('returns months ago', () => {
    const date = new Date('2024-04-15T12:00:00.000Z');

    expect(timeAgo(date)).toBe('2 months ago');
  });

  it('returns years ago', () => {
    const date = new Date('2022-06-15T12:00:00.000Z');

    expect(timeAgo(date)).toBe('2 years ago');
  });

  it('throws error for non-Date input', () => {
    expect(() => timeAgo('not a date' as unknown as Date)).toThrow(
      'Input must be a Date object'
    );
  });
});

describe('stableRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times within 5 minutes', () => {
    expect(stableRelativeTime('2024-06-15T11:58:00.000Z')).toBe('just now');
  });

  it('rounds minutes to nearest 5', () => {
    expect(stableRelativeTime('2024-06-15T11:47:00.000Z')).toBe('10 minutes ago');
  });

  it('returns hours ago', () => {
    expect(stableRelativeTime('2024-06-15T10:00:00.000Z')).toBe('2 hours ago');
  });

  it('returns days ago', () => {
    expect(stableRelativeTime('2024-06-12T12:00:00.000Z')).toBe('3 days ago');
  });

  it('returns months ago', () => {
    expect(stableRelativeTime('2024-04-15T12:00:00.000Z')).toBe('2 months ago');
  });

  it('returns years ago', () => {
    expect(stableRelativeTime('2023-06-15T12:00:00.000Z')).toBe('1 year ago');
  });
});

describe('formatDuration', () => {
  it('returns minutes only when under an hour', () => {
    const duration = { hours: 0, minutes: 45 } as Duration;

    expect(formatDuration(duration)).toBe('45 minutes');
  });

  it('returns "1 hour" for exactly one hour', () => {
    const duration = { hours: 1, minutes: 0 } as Duration;

    expect(formatDuration(duration)).toBe('1 hour');
  });

  it('returns "1 hour and X minutes" for 1 hour plus', () => {
    const duration = { hours: 1, minutes: 30 } as Duration;

    expect(formatDuration(duration)).toBe('1 hour and 30 minutes');
  });

  it('returns "X hours" for multiple hours without minutes', () => {
    const duration = { hours: 3, minutes: 0 } as Duration;

    expect(formatDuration(duration)).toBe('3 hours');
  });

  it('returns "X hours and Y minutes" for multiple hours with minutes', () => {
    const duration = { hours: 2, minutes: 15 } as Duration;

    expect(formatDuration(duration)).toBe('2 hours and 15 minutes');
  });
});

describe('formatAbbreviatedDuration', () => {
  it('returns minutes only when under an hour', () => {
    const duration = { hours: 0, minutes: 45 } as Duration;

    expect(formatAbbreviatedDuration(duration)).toBe('45m');
  });

  it('returns "1h" for exactly one hour', () => {
    const duration = { hours: 1, minutes: 0 } as Duration;

    expect(formatAbbreviatedDuration(duration)).toBe('1h');
  });

  it('returns "1h Xm" for 1 hour plus minutes', () => {
    const duration = { hours: 1, minutes: 30 } as Duration;

    expect(formatAbbreviatedDuration(duration)).toBe('1h 30m');
  });

  it('returns "Xh" for multiple hours without minutes', () => {
    const duration = { hours: 3, minutes: 0 } as Duration;

    expect(formatAbbreviatedDuration(duration)).toBe('3h');
  });

  it('returns "Xh Ym" for multiple hours with minutes', () => {
    const duration = { hours: 2, minutes: 15 } as Duration;

    expect(formatAbbreviatedDuration(duration)).toBe('2h 15m');
  });
});

describe('uploadAndGetEmbeddedLink', () => {
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads file and returns embedded link on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'test.jpg',
      file,
      fileType: 'image/jpeg',
    });

    expect(result).toContain('test.jpg');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://storage.example.com/upload',
      expect.objectContaining({
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    );
  });

  it('throws error when file is too large', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg');

    await expect(
      uploadAndGetEmbeddedLink({
        signedStorageURL: 'https://storage.example.com/upload',
        filename: 'large.jpg',
        file: largeFile,
        fileType: 'image/jpeg',
      })
    ).rejects.toThrow('less than 5MB');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns undefined when signedStorageURL is missing', async () => {
    const file = new File(['content'], 'test.jpg');

    const result = await uploadAndGetEmbeddedLink({
      signedStorageURL: '',
      filename: 'test.jpg',
      file,
      fileType: 'image/jpeg',
    });

    expect(result).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('throws error when fetch fails with non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await expect(
      uploadAndGetEmbeddedLink({
        signedStorageURL: 'https://storage.example.com/upload',
        filename: 'test.jpg',
        file,
        fileType: 'image/jpeg',
      })
    ).rejects.toThrow('Upload failed with status 500');
  });

  it('throws error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await expect(
      uploadAndGetEmbeddedLink({
        signedStorageURL: 'https://storage.example.com/upload',
        filename: 'test.jpg',
        file,
        fileType: 'image/jpeg',
      })
    ).rejects.toThrow('Network error');
  });

  it('uses file extension to determine content type for jpg', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'photo.jpg');
    await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'photo.jpg',
      file,
      fileType: '',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'image/jpeg' },
      })
    );
  });

  it('uses file extension to determine content type for jpeg', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'photo.jpeg');
    await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'photo.jpeg',
      file,
      fileType: '',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'image/jpeg' },
      })
    );
  });

  it('uses file extension to determine content type for png', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'image.png');
    await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'image.png',
      file,
      fileType: '',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'image/png' },
      })
    );
  });

  it('uses file extension to determine content type for gif', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'anim.gif');
    await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'anim.gif',
      file,
      fileType: '',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'image/gif' },
      })
    );
  });

  it('uses octet-stream for unknown file types', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'data.xyz');
    await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'data.xyz',
      file,
      fileType: '',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/octet-stream' },
      })
    );
  });

  it('encodes spaces in embedded link URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const file = new File(['content'], 'my file.jpg', { type: 'image/jpeg' });
    const result = await uploadAndGetEmbeddedLink({
      signedStorageURL: 'https://storage.example.com/upload',
      filename: 'my file.jpg',
      file,
      fileType: 'image/jpeg',
    });

    expect(result).toContain('my%20file.jpg');
    expect(result).not.toContain('my file.jpg');
  });
});

describe('durationHoursAndMinutes', () => {
  // start/end use UTC instants, so the resulting duration is timezone-independent.
  it.each([
    ['2024-01-01T10:00:00Z', '2024-01-01T10:30:00Z', 'for 30 minutes'],
    ['2024-01-01T10:00:00Z', '2024-01-01T11:00:00Z', 'for 1 hour'],
    ['2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z', 'for 2 hours'],
    ['2024-01-01T10:00:00Z', '2024-01-01T11:30:00Z', 'for 1 hour and 30 minutes'],
    ['2024-01-01T10:00:00Z', '2024-01-01T12:15:00Z', 'for 2 hours and 15 minutes'],
  ])('formats %s -> %s as "%s"', (start, end, expected) => {
    expect(durationHoursAndMinutes(start, end)).toBe(expected);
  });

  it('reports zero-length intervals as "for 0 minutes"', () => {
    expect(
      durationHoursAndMinutes('2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z')
    ).toBe('for 0 minutes');
  });
});

describe('getDurationObj', () => {
  it('returns the interval as an { hours, minutes } object', () => {
    expect(
      getDurationObj('2024-01-01T10:00:00Z', '2024-01-01T12:30:00Z')
    ).toEqual({ hours: 2, minutes: 30 });
  });
});

describe('compareDate', () => {
  const eventAt = (startTime: string) =>
    ({ startTime }) as unknown as Event;

  it.each([
    ['2024-01-01T10:00:00Z', '2024-01-02T10:00:00Z', -1],
    ['2024-01-02T10:00:00Z', '2024-01-01T10:00:00Z', 1],
    ['2024-01-01T10:00:00Z', '2024-01-01T10:00:00Z', 0],
  ])('compares %s vs %s -> %i', (a, b, expected) => {
    expect(compareDate(eventAt(a), eventAt(b))).toBe(expected);
  });
});

describe('getReadableTimeFromISO', () => {
  it('renders an ISO timestamp as a simple clock time', () => {
    expect(getReadableTimeFromISO('2024-01-01T13:30:00Z')).toMatch(
      /\d{1,2}:\d{2}/
    );
  });
});

describe('convertTimeToReadableFormat', () => {
  it('renders an ISO timestamp as a simple clock time', () => {
    expect(convertTimeToReadableFormat('2024-01-01T09:05:00Z')).toMatch(
      /\d{1,2}:\d{2}/
    );
  });
});

describe('relativeTimeHoursAndMinutes', () => {
  it('returns a past date as a relative "ago" string', () => {
    expect(relativeTimeHoursAndMinutes('2000-01-01T00:00:00Z')).toContain(
      'ago'
    );
  });
});

describe('updateTagsInCache', () => {
  type FieldRef = { __ref: string; text: string };

  // Builds a minimal Apollo cache stub that captures the value returned by the
  // `tags` field policy so we can assert the merge/de-dup behavior directly.
  const buildCache = (existingRefs: FieldRef[]) => {
    const writeFragment = vi.fn(
      ({ data }: { data: TagData }) =>
        ({ __ref: `Tags:${data.text}`, text: data.text }) as FieldRef
    );
    let merged: FieldRef[] | undefined;
    const cache = {
      writeFragment,
      modify: ({
        fields,
      }: {
        fields: {
          tags: (
            existing: FieldRef[] | undefined,
            helpers: { readField: (f: string, ref: FieldRef) => unknown }
          ) => FieldRef[];
        };
      }) => {
        merged = fields.tags(existingRefs, {
          readField: (field, ref) => ref[field as keyof FieldRef],
        });
      },
    } as unknown as ApolloCache<unknown>;
    return { cache, writeFragment, getMerged: () => merged };
  };

  it('appends a new tag ahead of the existing refs', () => {
    const existing: FieldRef[] = [{ __ref: 'Tags:old', text: 'old' }];
    const { cache, getMerged } = buildCache(existing);

    updateTagsInCache(cache, [{ text: 'new' }] as TagData[]);

    expect(getMerged()).toEqual([
      { __ref: 'Tags:new', text: 'new' },
      { __ref: 'Tags:old', text: 'old' },
    ]);
  });

  it('does not duplicate a tag that already exists in the cache', () => {
    const existing: FieldRef[] = [{ __ref: 'Tags:dup', text: 'dup' }];
    const { cache, getMerged } = buildCache(existing);

    updateTagsInCache(cache, [{ text: 'dup' }] as TagData[]);

    expect(getMerged()).toEqual([{ __ref: 'Tags:dup', text: 'dup' }]);
  });

  it('writes a fragment for every updated tag', () => {
    const { cache, writeFragment } = buildCache([]);

    updateTagsInCache(cache, [{ text: 'a' }, { text: 'b' }] as TagData[]);

    expect(writeFragment).toHaveBeenCalledTimes(2);
  });
});

describe('getTimePieces', () => {
  it('breaks a DateTime into stringified calendar/clock pieces', () => {
    const dt = DateTime.fromObject(
      { year: 2024, month: 3, day: 5, hour: 14 },
      { zone: 'utc' }
    );

    expect(getTimePieces(dt)).toEqual({
      startTimeYear: '2024',
      startTimeMonth: '3',
      startTimeDayOfMonth: '5',
      startTimeDayOfWeek: '2', // Tuesday
      startTimeHourOfDay: 14,
    });
  });
});

describe('getDatePieces', () => {
  const dt = DateTime.fromObject(
    { year: 2024, month: 3, day: 5, hour: 14 },
    { zone: 'utc' }
  );

  it('uses "all day" for the time of day when isAllDay is true', () => {
    expect(getDatePieces(dt, true).timeOfDay).toBe('all day');
  });

  it('renders a clock time for the time of day when not all day', () => {
    expect(getDatePieces(dt, false).timeOfDay).toMatch(/\d{1,2}:\d{2}/);
  });

  it('exposes the long weekday name', () => {
    expect(getDatePieces(dt).weekday).toBe('Tuesday');
  });
});

describe('relativeTime', () => {
  it('returns a past date as a relative "ago" string', () => {
    expect(relativeTime('2000-01-01T00:00:00Z')).toContain('ago');
  });
});
