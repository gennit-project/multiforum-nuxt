import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { DateTime } from 'luxon';
import IssueLockedBanner from './IssueLockedBanner.vue';

const mountBanner = (props: Record<string, unknown> = {}) =>
  mount(IssueLockedBanner, { props });

describe('IssueLockedBanner', () => {
  it('always shows the locked heading', () => {
    expect(mountBanner().text()).toContain('This issue is locked');
  });

  it('shows the lock reason when one is provided', () => {
    expect(mountBanner({ lockReason: 'Spam' }).text()).toContain('Reason: Spam');
  });

  it('omits the reason line when no lock reason is given', () => {
    expect(mountBanner({ lockReason: null }).text()).not.toContain('Reason:');
  });

  it("shows the locker's display name", () => {
    expect(mountBanner({ lockedByDisplayName: 'Alice' }).text()).toContain(
      'Locked by Alice'
    );
  });

  it('falls back to Unknown when there is no display name', () => {
    expect(mountBanner({ lockedByDisplayName: null }).text()).toContain(
      'Locked by Unknown'
    );
  });

  it('shows the formatted locked-at date when provided', () => {
    const lockedAt = '2026-01-15T12:00:00.000Z';
    const expected = DateTime.fromISO(lockedAt).toLocaleString(
      DateTime.DATETIME_MED
    );
    expect(mountBanner({ lockedByDisplayName: 'Alice', lockedAt }).text()).toContain(
      expected
    );
  });

  it('omits the date phrase when there is no locked-at timestamp', () => {
    expect(
      mountBanner({ lockedByDisplayName: 'Alice', lockedAt: null }).text()
    ).not.toContain(' on ');
  });
});
