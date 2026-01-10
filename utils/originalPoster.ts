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
