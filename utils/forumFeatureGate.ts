/**
 * Shared gating logic for forum feature index pages (downloads, events, …).
 * A feature is shown only when it is enabled at BOTH the server and channel
 * level and nothing is loading or errored. When it is hidden, a single
 * human-readable reason is derived in a fixed precedence: load error, then
 * server-level disablement, then channel-level disablement.
 *
 * Extracted from the near-identical logic in the downloads and events index
 * pages so it can be unit-tested without mounting either page.
 */

export type ForumFeatureGateMessages = {
  /** Shown when the channel or server config failed to load. */
  error: string;
  /** Shown when the feature is disabled server-wide. */
  serverDisabled: string;
  /** Shown when the feature is disabled for this specific forum. */
  channelDisabled: string;
};

export type ForumFeatureGateParams = {
  loading: boolean;
  hasError: boolean;
  serverEnabled: boolean;
  channelEnabled: boolean;
  messages: ForumFeatureGateMessages;
};

export type ForumFeatureGateResult = {
  shouldShow: boolean;
  errorMessage: string;
};

export function evaluateForumFeatureGate(
  params: ForumFeatureGateParams
): ForumFeatureGateResult {
  const { loading, hasError, serverEnabled, channelEnabled, messages } = params;

  const shouldShow =
    !loading && !hasError && serverEnabled && channelEnabled;

  let errorMessage = '';
  if (hasError) {
    errorMessage = messages.error;
  } else if (!serverEnabled) {
    errorMessage = messages.serverDisabled;
  } else if (!channelEnabled) {
    errorMessage = messages.channelDisabled;
  }

  return { shouldShow, errorMessage };
}
