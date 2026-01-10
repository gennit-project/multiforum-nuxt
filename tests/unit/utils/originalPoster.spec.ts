import { describe, it, expect } from 'vitest';
import {
  isCurrentUserOriginalPoster,
  getIssueActionVisibility,
} from '@/utils/originalPoster';

describe('isCurrentUserOriginalPoster', () => {
  it('returns true when usernames match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'alice',
      })
    ).toBe(true);
  });

  it('returns true when mod profile names match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalModProfileName: 'ModAlice',
        currentModProfileName: 'ModAlice',
      })
    ).toBe(true);
  });

  it('returns true when user is OP even if also a mod', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        originalModProfileName: 'ModAlice',
        currentUsername: 'alice',
        currentModProfileName: 'ModAlice',
      })
    ).toBe(true);
  });

  it('returns false when usernames do not match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: 'alice',
        currentUsername: 'bob',
      })
    ).toBe(false);
  });

  it('returns false when mod profile names do not match', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalModProfileName: 'ModAlice',
        currentModProfileName: 'ModBob',
      })
    ).toBe(false);
  });

  it('returns false when no identifiers are provided', () => {
    expect(
      isCurrentUserOriginalPoster({
        originalAuthorUsername: '',
        originalModProfileName: '',
        currentUsername: '',
        currentModProfileName: '',
      })
    ).toBe(false);
  });
});

describe('getIssueActionVisibility', () => {
  it('reported comment: OP only has OP actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: true,
      modActionsEnabled: false,
    });
  });

  it('reported comment: non-author only has mod actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: false,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: true,
    });
  });

  it('reported discussion: OP only has OP actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: true,
      modActionsEnabled: false,
    });
  });

  it('reported discussion: non-author only has mod actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: false,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: true,
    });
  });

  it('reported event: OP only has OP actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: true,
      modActionsEnabled: false,
    });
  });

  it('reported event: non-author only has mod actions enabled', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: true,
        isOriginalPoster: false,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: true,
    });
  });

  it('returns both actions disabled when there is no related content', () => {
    expect(
      getIssueActionVisibility({
        hasRelatedContent: false,
        isOriginalPoster: true,
      })
    ).toMatchObject({
      opActionsEnabled: false,
      modActionsEnabled: false,
    });
  });
});
