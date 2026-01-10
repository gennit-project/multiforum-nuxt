export type OriginalPosterContext = {
  originalAuthorUsername?: string | null;
  originalModProfileName?: string | null;
  currentUsername?: string | null;
  currentModProfileName?: string | null;
};

export type IssueActionVisibilityContext = {
  hasRelatedContent: boolean;
  isOriginalPoster: boolean;
};

type CommentAuthor = {
  __typename?: 'User' | 'ModerationProfile' | string;
  username?: string | null;
  displayName?: string | null;
};

export type GetOriginalPosterInput = {
  Discussion?: { Author?: { username?: string | null } | null } | null;
  Event?: { Poster?: { username?: string | null } | null } | null;
  Comment?: { CommentAuthor?: CommentAuthor | null } | null;
};

export const getOriginalPoster = (
  input: GetOriginalPosterInput
): { username: string; modProfileName: string } => {
  const discussionUsername = input.Discussion?.Author?.username;
  if (discussionUsername) {
    return { username: discussionUsername, modProfileName: '' };
  }

  const eventUsername = input.Event?.Poster?.username;
  if (eventUsername) {
    return { username: eventUsername, modProfileName: '' };
  }

  const commentAuthor = input.Comment?.CommentAuthor;
  if (commentAuthor?.__typename === 'User' && commentAuthor.username) {
    return { username: commentAuthor.username, modProfileName: '' };
  }
  if (
    commentAuthor?.__typename === 'ModerationProfile' &&
    commentAuthor.displayName
  ) {
    return { username: '', modProfileName: commentAuthor.displayName };
  }

  return { username: '', modProfileName: '' };
};

export const isCurrentUserOriginalPoster = (
  context: OriginalPosterContext
): boolean => {
  const {
    originalAuthorUsername,
    originalModProfileName,
    currentUsername,
    currentModProfileName,
  } = context;

  const isUserAuthor =
    !!currentUsername &&
    !!originalAuthorUsername &&
    currentUsername === originalAuthorUsername;
  const isModAuthor =
    !!currentModProfileName &&
    !!originalModProfileName &&
    currentModProfileName === originalModProfileName;

  return isUserAuthor || isModAuthor;
};

export const getIssueActionVisibility = (
  context: IssueActionVisibilityContext
): {
  showOpActions: boolean;
  showModActions: boolean;
  opActionsEnabled: boolean;
  modActionsEnabled: boolean;
} => {
  if (!context.hasRelatedContent) {
    return {
      showOpActions: false,
      showModActions: false,
      opActionsEnabled: false,
      modActionsEnabled: false,
    };
  }

  const opActionsEnabled = context.isOriginalPoster;
  const modActionsEnabled = !context.isOriginalPoster;

  return {
    showOpActions: true,
    showModActions: true,
    opActionsEnabled,
    modActionsEnabled,
  };
};
