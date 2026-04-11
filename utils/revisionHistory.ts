export type RevisionAuthorLike =
  | {
      username?: string | null;
      displayName?: string | null;
      User?: {
        username?: string | null;
      } | null;
    }
  | null
  | undefined;

export type RevisionVersionLike = {
  id: string;
  body?: string | null;
  title?: string | null;
  createdAt: string;
  editReason?: string | null;
  Author?: RevisionAuthorLike;
};

export type RevisionPair<TVersion extends RevisionVersionLike> = {
  id: string;
  author: string;
  createdAt: string;
  isCurrent: boolean;
  oldVersion: TVersion;
  newVersion: TVersion;
  oldVersionData: TVersion;
  newVersionData: TVersion;
};

type PairAuthorContext<TVersion extends RevisionVersionLike> = {
  oldVersion: TVersion;
  newVersion: TVersion;
  index: number;
};

type BuildSequentialRevisionPairsParams<TVersion extends RevisionVersionLike> =
  {
    pastVersions: readonly TVersion[] | null | undefined;
    currentVersion: TVersion;
    currentAuthor?: RevisionAuthorLike;
    skipUnchangedCurrent?: boolean;
    getHistoricalPairAuthor?: (
      context: PairAuthorContext<TVersion>
    ) => RevisionAuthorLike | string;
  };

export const getRevisionAuthorName = (author: RevisionAuthorLike | string) => {
  if (typeof author === 'string') {
    return author || '[Deleted]';
  }

  if (!author) {
    return '[Deleted]';
  }

  if (author.username) {
    return author.username;
  }

  if (author.displayName) {
    return author.displayName;
  }

  return author.User?.username || '[Deleted]';
};

export const getVersionAuthorName = (version: RevisionVersionLike) => {
  return getRevisionAuthorName(version.Author);
};

export const getRevisionContent = (version: RevisionVersionLike) => {
  return version.body || version.title || '';
};

export const buildSequentialRevisionPairs = <
  TVersion extends RevisionVersionLike,
>({
  pastVersions,
  currentVersion,
  currentAuthor,
  skipUnchangedCurrent = false,
  getHistoricalPairAuthor = ({ oldVersion }) => oldVersion.Author,
}: BuildSequentialRevisionPairsParams<TVersion>): RevisionPair<TVersion>[] => {
  if (!pastVersions?.length) {
    return [];
  }

  const pairs: RevisionPair<TVersion>[] = [];
  const mostRecentPastVersion = pastVersions[0];

  if (
    mostRecentPastVersion &&
    (!skipUnchangedCurrent ||
      getRevisionContent(mostRecentPastVersion) !==
        getRevisionContent(currentVersion))
  ) {
    pairs.push({
      id: 'most-recent-edit',
      author: getRevisionAuthorName(currentAuthor || currentVersion.Author),
      createdAt: currentVersion.createdAt,
      isCurrent: true,
      oldVersion: mostRecentPastVersion,
      newVersion: currentVersion,
      oldVersionData: mostRecentPastVersion,
      newVersionData: currentVersion,
    });
  }

  pastVersions.forEach((oldVersion, index) => {
    if (index === 0) {
      return;
    }

    const newVersion = pastVersions[index - 1];
    if (!newVersion) {
      return;
    }

    pairs.push({
      id: oldVersion.id,
      author: getRevisionAuthorName(
        getHistoricalPairAuthor({ oldVersion, newVersion, index })
      ),
      createdAt: oldVersion.createdAt,
      isCurrent: false,
      oldVersion,
      newVersion,
      oldVersionData: oldVersion,
      newVersionData: newVersion,
    });
  });

  return pairs;
};
