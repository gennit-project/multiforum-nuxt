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

export const INITIAL_REVISION_ID = '__initial__';
export const SELECTED_WIKI_REVISION_PREFIX = 'selected-';

export const buildSelectedWikiRevisionRouteId = (revisionId: string) => {
  return `${SELECTED_WIKI_REVISION_PREFIX}${revisionId}`;
};

export const isSelectedWikiRevisionRouteId = (revisionId: string) => {
  return revisionId.startsWith(SELECTED_WIKI_REVISION_PREFIX);
};

export const parseSelectedWikiRevisionRouteId = (revisionId: string) => {
  if (!isSelectedWikiRevisionRouteId(revisionId)) {
    return null;
  }

  return revisionId.slice(SELECTED_WIKI_REVISION_PREFIX.length);
};

const buildInitialRevision = <TVersion extends RevisionVersionLike>(
  currentVersion: TVersion
) =>
  ({
    id: INITIAL_REVISION_ID,
    body: '',
    title: '',
    createdAt: currentVersion.createdAt,
    editReason: null,
    Author: { username: '[Initial]' },
  }) as TVersion;

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

export const buildSelectedRevisionPairs = <
  TVersion extends RevisionVersionLike,
>({
  pastVersions,
  currentVersion,
  currentAuthor,
}: {
  pastVersions: readonly TVersion[] | null | undefined;
  currentVersion: TVersion;
  currentAuthor?: RevisionAuthorLike;
}): RevisionPair<TVersion>[] => {
  const pairs: RevisionPair<TVersion>[] = [];
  const versions = [...(pastVersions || [])].reverse();
  let previousVersion = buildInitialRevision(currentVersion);

  versions.forEach((version) => {
    pairs.push({
      id: buildSelectedWikiRevisionRouteId(version.id),
      author: getRevisionAuthorName(version.Author),
      createdAt: version.createdAt,
      isCurrent: false,
      oldVersion: previousVersion,
      newVersion: version,
      oldVersionData: previousVersion,
      newVersionData: version,
    });

    previousVersion = version;
  });

  pairs.push({
    id: buildSelectedWikiRevisionRouteId(currentVersion.id),
    author: getRevisionAuthorName(currentAuthor || currentVersion.Author),
    createdAt: currentVersion.createdAt,
    isCurrent: true,
    oldVersion: previousVersion,
    newVersion: currentVersion,
    oldVersionData: previousVersion,
    newVersionData: currentVersion,
  });

  return pairs;
};
