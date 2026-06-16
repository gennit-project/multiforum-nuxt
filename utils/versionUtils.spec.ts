import { describe, expect, it } from 'vitest';
import {
  compareVersionStrings,
  resolveDefaultVersion,
} from '@/utils/versionUtils';

type CompareCase = {
  name: string;
  left: string;
  right: string;
  expected: -1 | 0 | 1;
};

const cases: CompareCase[] = [
  {
    name: 'compares numeric core versions (smaller)',
    left: '1.2.0',
    right: '1.10.0',
    expected: -1,
  },
  {
    name: 'compares numeric core versions (larger)',
    left: '2.0.0',
    right: '1.9.9',
    expected: 1,
  },
  {
    name: 'compares numeric core versions (equal)',
    left: '1.2.3',
    right: '1.2.3',
    expected: 0,
  },
  {
    name: 'treats missing core parts as zero (equal)',
    left: '1.2',
    right: '1.2.0',
    expected: 0,
  },
  {
    name: 'treats missing core parts as zero (smaller)',
    left: '1.2',
    right: '1.2.1',
    expected: -1,
  },
  {
    name: 'ignores v-prefix and build metadata (equal)',
    left: 'v1.2.3',
    right: '1.2.3+build.5',
    expected: 0,
  },
  {
    name: 'ignores v-prefix and build metadata (larger)',
    left: 'v1.2.4+build.2',
    right: '1.2.3',
    expected: 1,
  },
  {
    name: 'orders prerelease before release (alpha < release)',
    left: '1.0.0-alpha',
    right: '1.0.0',
    expected: -1,
  },
  {
    name: 'orders prerelease before release (release > beta)',
    left: '1.0.0',
    right: '1.0.0-beta',
    expected: 1,
  },
  {
    name: 'compares prerelease identifiers (alpha < beta)',
    left: '1.0.0-alpha',
    right: '1.0.0-beta',
    expected: -1,
  },
  {
    name: 'compares prerelease identifiers (alpha.1 < alpha.2)',
    left: '1.0.0-alpha.1',
    right: '1.0.0-alpha.2',
    expected: -1,
  },
  {
    name: 'compares prerelease identifiers (equal)',
    left: '1.0.0-alpha.1',
    right: '1.0.0-alpha.1',
    expected: 0,
  },
  {
    name: 'orders numeric prerelease identifiers before non-numeric',
    left: '1.0.0-1',
    right: '1.0.0-alpha',
    expected: -1,
  },
  {
    name: 'orders non-numeric prerelease identifiers after numeric',
    left: '1.0.0-alpha',
    right: '1.0.0-1',
    expected: 1,
  },
  {
    name: 'orders shorter prerelease lists before longer lists when equal',
    left: '1.0.0-alpha',
    right: '1.0.0-alpha.1',
    expected: -1,
  },
];

describe('compareVersionStrings', () => {
  it.each(cases)('$name', ({ left, right, expected }) => {
    expect(compareVersionStrings(left, right)).toBe(expected);
  });
});

describe('resolveDefaultVersion', () => {
  const base = {
    availableVersions: ['2.0.0', '1.0.0'],
    installedVersion: undefined,
    latestVersion: undefined,
    shouldAutoUpdate: false,
    currentSelected: '',
  };

  it('selects the latest version when auto-updating and none is selected', () => {
    expect(
      resolveDefaultVersion({
        ...base,
        latestVersion: '2.0.0',
        shouldAutoUpdate: true,
      })
    ).toBe('2.0.0');
  });

  it('defaults to the installed version when one exists', () => {
    expect(
      resolveDefaultVersion({ ...base, installedVersion: '1.0.0' })
    ).toBe('1.0.0');
  });

  it('falls back to the newest available version', () => {
    expect(resolveDefaultVersion(base)).toBe('2.0.0');
  });

  it('keeps the current selection when one is already set', () => {
    expect(
      resolveDefaultVersion({ ...base, currentSelected: '1.0.0' })
    ).toBe('1.0.0');
  });

  it('switches an existing selection to latest when auto-updating', () => {
    expect(
      resolveDefaultVersion({
        ...base,
        currentSelected: '1.0.0',
        latestVersion: '2.0.0',
        shouldAutoUpdate: true,
      })
    ).toBe('2.0.0');
  });

  it('returns the current (empty) selection when nothing is available', () => {
    expect(
      resolveDefaultVersion({ ...base, availableVersions: [] })
    ).toBe('');
  });
});
