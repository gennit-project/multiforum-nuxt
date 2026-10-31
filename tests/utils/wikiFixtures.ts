import type { WikiPageSelection } from '@/types/Wiki';
export const makeWikiPage = (
  overrides: Partial<WikiPageSelection> = {}
): WikiPageSelection => ({
  id: 'w1',
  title: 'Intro',
  body: 'Hi',
  editReason: null,
  slug: 'intro',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: null,
  locked: false,
  lockedAt: null,
  lockReason: null,
  lockedByUsername: null,
  VersionAuthor: { username: 'alice' },
  ChildPages: [],
  PastVersions: [],
  ...overrides,
});
