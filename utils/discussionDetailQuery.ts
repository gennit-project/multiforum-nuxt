// The discussion/download detail page, its content component and the title
// edit form all query the same detail document. Apollo only deduplicates
// in-flight requests and shares cache entries when the variables are
// identical, so every caller builds them here. Previously the callers passed
// different shapes ('' vs null mod name, extra undeclared variables), which
// sent the same query to the backend twice on every detail page view.

type DetailQueryVariablesParams = {
  discussionId: string;
  downloadMode: boolean;
  modProfileName?: string | null;
  username?: string | null;
  channelUniqueName: string;
};

export type DiscussionDetailQueryVariables = {
  id: string;
  loggedInModName: string | null;
};

export type DownloadDetailQueryVariables = DiscussionDetailQueryVariables & {
  loggedInUsername: string | null;
  channelUniqueName: string;
};

/**
 * Variables for GET_DISCUSSION_DETAIL / GET_DOWNLOAD_DETAIL, containing exactly
 * the variables each query declares.
 */
export const buildDetailQueryVariables = (
  params: DetailQueryVariablesParams
): DiscussionDetailQueryVariables | DownloadDetailQueryVariables => {
  const base: DiscussionDetailQueryVariables = {
    id: params.discussionId,
    loggedInModName: params.modProfileName || null,
  };
  if (!params.downloadMode) return base;
  return {
    ...base,
    loggedInUsername: params.username || null,
    channelUniqueName: params.channelUniqueName,
  };
};
