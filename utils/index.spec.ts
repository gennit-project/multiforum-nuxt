import { describe, it, expect } from 'vitest';
import {
  isFileSizeValid,
  getUploadFileName,
  encodeSpacesInURL,
  getDuration,
  getTagLabel,
  getLinksInText,
  getChannelLabel,
} from './index';

const fileOfSize = (bytes: number, name = 'f.zip'): File => {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

describe('isFileSizeValid', () => {
  it('accepts a file under the 5MB default limit', () => {
    expect(isFileSizeValid({ file: fileOfSize(1024) }).valid).toBe(true);
  });

  it('rejects a file over the 5MB default limit', () => {
    expect(isFileSizeValid({ file: fileOfSize(6 * 1024 * 1024) }).valid).toBe(false);
  });

  it('applies the stricter 1MB limit for profile pictures', () => {
    expect(
      isFileSizeValid({ file: fileOfSize(2 * 1024 * 1024), isProfilePic: true }).valid
    ).toBe(false);
  });
});

describe('getUploadFileName', () => {
  it('replaces spaces in the file name with underscores', () => {
    const name = getUploadFileName({
      file: fileOfSize(10, 'my file.png'),
      username: 'alice',
      filename: 'my file.png',
      fileType: 'image/png',
    });
    expect(name).not.toContain(' ');
  });

  it('includes the username', () => {
    const name = getUploadFileName({
      file: fileOfSize(10, 'a.png'),
      username: 'alice',
      filename: 'a.png',
      fileType: 'image/png',
    });
    expect(name).toContain('alice');
  });
});

describe('encodeSpacesInURL', () => {
  it('encodes spaces as %20', () => {
    expect(encodeSpacesInURL('a b c')).toBe('a%20b%20c');
  });
});

describe('getDuration', () => {
  it('formats a 90-minute span as "1h 30m"', () => {
    expect(
      getDuration('2024-01-01T10:00:00.000Z', '2024-01-01T11:30:00.000Z')
    ).toBe('1h 30m');
  });

  it('returns an empty string when the end precedes the start', () => {
    expect(
      getDuration('2024-01-01T11:00:00.000Z', '2024-01-01T10:00:00.000Z')
    ).toBe('');
  });
});

describe('getTagLabel', () => {
  it('returns the bare label with no tags', () => {
    expect(getTagLabel([])).toBe('Tags');
  });

  it('includes the count when tags are selected', () => {
    expect(getTagLabel(['a', 'b'])).toBe('Tags (2)');
  });
});

describe('getLinksInText', () => {
  it('extracts a non-image http link', () => {
    expect(getLinksInText('see https://example.com/page now')).toEqual([
      'https://example.com/page',
    ]);
  });

  it('returns an empty array for text with no links', () => {
    expect(getLinksInText('no links here')).toEqual([]);
  });
});

describe('getChannelLabel', () => {
  it('returns "All Forums" when none are selected', () => {
    expect(getChannelLabel([])).toBe('All Forums');
  });

  it('includes the count when forums are selected', () => {
    expect(getChannelLabel(['cats', 'dogs'])).toBe('Forums (2)');
  });
});
