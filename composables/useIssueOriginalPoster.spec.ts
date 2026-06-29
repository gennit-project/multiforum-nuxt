import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useIssueOriginalPoster } from './useIssueOriginalPoster';

type Params = Parameters<typeof useIssueOriginalPoster>[0];

const setup = (overrides: Partial<Record<keyof Params, unknown>> = {}) =>
  useIssueOriginalPoster({
    relatedDiscussion: ref(null),
    relatedEvent: ref(null),
    relatedComment: ref(null),
    username: ref(''),
    modProfileName: ref(''),
    hasRelatedContent: ref(false),
    ...(overrides as Partial<Params>),
  } as Params);

describe('useIssueOriginalPoster — original poster derivation', () => {
  it('resolves the username from a related discussion author', () => {
    const { resolvedOriginalAuthorUsername } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
    });

    expect(resolvedOriginalAuthorUsername.value).toBe('alice');
  });

  it('resolves the username from a related event poster', () => {
    const { resolvedOriginalAuthorUsername } = setup({
      relatedEvent: ref({ Poster: { username: 'bob' } }),
    });

    expect(resolvedOriginalAuthorUsername.value).toBe('bob');
  });

  it('resolves the mod profile name from a related comment authored by a mod', () => {
    const { resolvedOriginalModProfileName } = setup({
      relatedComment: ref({
        CommentAuthor: {
          __typename: 'ModerationProfile',
          displayName: 'mod-zoe',
        },
      }),
    });

    expect(resolvedOriginalModProfileName.value).toBe('mod-zoe');
  });

  it('falls back to empty identifiers when no related content has an author', () => {
    const { resolvedOriginalAuthorUsername, resolvedOriginalModProfileName } =
      setup();

    expect({
      username: resolvedOriginalAuthorUsername.value,
      modProfileName: resolvedOriginalModProfileName.value,
    }).toEqual({ username: '', modProfileName: '' });
  });
});

describe('useIssueOriginalPoster — author type', () => {
  it('reports a mod author type when the original poster is a mod', () => {
    const { authorType } = setup({
      relatedComment: ref({
        CommentAuthor: {
          __typename: 'ModerationProfile',
          displayName: 'mod-zoe',
        },
      }),
    });

    expect(authorType.value).toBe('mod');
  });

  it('reports a user author type when the original poster is a user', () => {
    const { authorType } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
    });

    expect(authorType.value).toBe('user');
  });
});

describe('useIssueOriginalPoster — is-author-bot', () => {
  it('flags the author as a bot when the related comment author is a bot', () => {
    const { isAuthorBot } = setup({
      relatedComment: ref({
        CommentAuthor: { __typename: 'User', isBot: true },
      }),
    });

    expect(isAuthorBot.value).toBe(true);
  });

  it('does not flag a non-bot related comment author', () => {
    const { isAuthorBot } = setup({
      relatedComment: ref({
        CommentAuthor: { __typename: 'User', isBot: false },
      }),
    });

    expect(isAuthorBot.value).toBe(false);
  });
});

describe('useIssueOriginalPoster — current viewer matching', () => {
  it('matches the current user against the original user author', () => {
    const { isOriginalUserAuthor } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
      username: ref('alice'),
    });

    expect(isOriginalUserAuthor.value).toBe(true);
  });

  it('does not match a different current user as the original author', () => {
    const { isOriginalUserAuthor } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
      username: ref('carol'),
    });

    expect(isOriginalUserAuthor.value).toBe(false);
  });

  it('matches the current mod against the original mod author', () => {
    const { isOriginalModAuthor } = setup({
      relatedComment: ref({
        CommentAuthor: {
          __typename: 'ModerationProfile',
          displayName: 'mod-zoe',
        },
      }),
      modProfileName: ref('mod-zoe'),
    });

    expect(isOriginalModAuthor.value).toBe(true);
  });

  it('treats the viewer as the original poster when their username matches', () => {
    const { isCurrentUserOriginalPoster } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
      username: ref('alice'),
    });

    expect(isCurrentUserOriginalPoster.value).toBe(true);
  });
});

describe('useIssueOriginalPoster — action visibility', () => {
  it('hides all actions when there is no related content', () => {
    const { issueActionVisibility } = setup({ hasRelatedContent: ref(false) });

    expect(issueActionVisibility.value).toMatchObject({
      showModActions: false,
      showOpActions: false,
    });
  });

  it('shows mod actions for related content the viewer did not author', () => {
    const { issueActionVisibility } = setup({
      relatedDiscussion: ref({ Author: { username: 'alice' } }),
      username: ref('mod-viewer'),
      hasRelatedContent: ref(true),
    });

    expect(issueActionVisibility.value.showModActions).toBe(true);
  });

  it('reacts to changes in the underlying related content', () => {
    const relatedDiscussion = ref<{
      Author?: { username?: string | null } | null;
    } | null>(null);
    const { resolvedOriginalAuthorUsername } = setup({ relatedDiscussion });

    relatedDiscussion.value = { Author: { username: 'late-arrival' } };

    expect(resolvedOriginalAuthorUsername.value).toBe('late-arrival');
  });
});
