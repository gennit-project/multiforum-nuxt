import { describe, it, expect } from 'vitest';
import {
  getUploadFileName,
  encodeSpacesInURL,
  getDuration,
  getTagLabel,
  getChannelLabel,
} from './index';

const fileOfSize = (bytes: number, name = 'f.zip'): File => {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

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

describe('getChannelLabel', () => {
  it('returns "All Forums" when none are selected', () => {
    expect(getChannelLabel([])).toBe('All Forums');
  });

  it('includes the count when forums are selected', () => {
    expect(getChannelLabel(['cats', 'dogs'])).toBe('Forums (2)');
  });
});
