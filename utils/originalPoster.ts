export type OriginalPosterContext = {
  originalAuthorUsername?: string | null;
  originalModProfileName?: string | null;
  currentUsername?: string | null;
  currentModProfileName?: string | null;
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
