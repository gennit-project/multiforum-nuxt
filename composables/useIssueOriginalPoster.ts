import { computed } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import {
  isCurrentUserOriginalPoster as isOriginalPoster,
  getIssueActionVisibility,
  getOriginalPoster,
  type GetOriginalPosterInput,
  type IssueActionVisibilityContext,
} from '@/utils/originalPoster';
import {
  isRelatedCommentAuthorBot,
  resolveAuthorType,
} from '@/utils/issueDetailDisplay';

type MaybeRef<T> = Ref<T> | ComputedRef<T>;

// Structural shape that satisfies both getOriginalPoster (needs CommentAuthor
// username/displayName) and isRelatedCommentAuthorBot (needs __typename/isBot).
type RelatedCommentInput = {
  CommentAuthor?: {
    __typename?: string;
    username?: string | null;
    displayName?: string | null;
    isBot?: boolean | null;
  } | null;
} | null;

type UseIssueOriginalPosterParams = {
  relatedDiscussion: MaybeRef<GetOriginalPosterInput['Discussion']>;
  relatedEvent: MaybeRef<GetOriginalPosterInput['Event']>;
  relatedComment: MaybeRef<RelatedCommentInput>;
  username: MaybeRef<string>;
  modProfileName: MaybeRef<string>;
  hasRelatedContent: MaybeRef<boolean>;
};

/**
 * Derives "who is the original poster of the reported content, and what can
 * they do here" from the issue's related discussion/event/comment plus the
 * current viewer's identity. All values are pure computeds over the inputs,
 * which keeps the branchy author-resolution logic unit-testable in isolation
 * instead of locked inside IssueDetail.vue's render.
 */
export function useIssueOriginalPoster({
  relatedDiscussion,
  relatedEvent,
  relatedComment,
  username,
  modProfileName,
  hasRelatedContent,
}: UseIssueOriginalPosterParams) {
  const derivedOriginalPoster = computed(() => {
    const author = getOriginalPoster({
      Discussion: relatedDiscussion.value,
      Event: relatedEvent.value,
      Comment: relatedComment.value,
    });
    if (author.username || author.modProfileName) {
      return author;
    }
    return { username: '', modProfileName: '' };
  });

  const isAuthorBot = computed(() =>
    isRelatedCommentAuthorBot(relatedComment.value)
  );

  const resolvedOriginalAuthorUsername = computed(
    () => derivedOriginalPoster.value.username || ''
  );

  const resolvedOriginalModProfileName = computed(
    () => derivedOriginalPoster.value.modProfileName || ''
  );

  const isOriginalUserAuthor = computed(
    () =>
      !!username.value &&
      resolvedOriginalAuthorUsername.value === username.value
  );

  const isOriginalModAuthor = computed(
    () =>
      !!modProfileName.value &&
      resolvedOriginalModProfileName.value === modProfileName.value
  );

  const isCurrentUserOriginalPoster = computed(() =>
    isOriginalPoster({
      originalAuthorUsername: resolvedOriginalAuthorUsername.value,
      originalModProfileName: resolvedOriginalModProfileName.value,
      currentUsername: username.value,
      currentModProfileName: modProfileName.value,
    })
  );

  const authorType = computed(() =>
    resolveAuthorType({
      modProfileName: resolvedOriginalModProfileName.value,
      username: resolvedOriginalAuthorUsername.value,
    })
  );

  const issueActionVisibility = computed<
    ReturnType<typeof getIssueActionVisibility>
  >(() =>
    getIssueActionVisibility({
      hasRelatedContent: hasRelatedContent.value,
      isOriginalPoster: isCurrentUserOriginalPoster.value,
    } satisfies IssueActionVisibilityContext)
  );

  return {
    derivedOriginalPoster,
    isAuthorBot,
    resolvedOriginalAuthorUsername,
    resolvedOriginalModProfileName,
    isOriginalUserAuthor,
    isOriginalModAuthor,
    isCurrentUserOriginalPoster,
    authorType,
    issueActionVisibility,
  };
}
