import type {
  GetIssueQuery,
  GetIssueActivityQuery,
  GetIssueRelatedDiscussionQuery,
  GetSiteWideIssueListQuery,
} from '@/__generated__/operations';

export type IssueSummary = GetIssueQuery['issues'][number];
export type IssueActivity = GetIssueActivityQuery['issues'][number];
export type IssueActivityItem = IssueActivity['ActivityFeed'][number];
export type IssueView = IssueSummary &
  Partial<Pick<IssueActivity, 'ActivityFeed' | 'ActivityFeedConnection'>>;
export type IssueRelatedDiscussion = GetIssueRelatedDiscussionQuery['discussions'][number];
export type IssueListItem = NonNullable<GetSiteWideIssueListQuery['getSiteWideIssueList']>['issues'][number];

// Timeline and permalink producers deliberately select different optional metadata.
// Query/cache contracts remain the exact operation selections above.
type ActivityComment = NonNullable<IssueActivityItem['Comment']>;
type ActivityModerator = NonNullable<IssueActivityItem['ModerationProfile']>;
export type ActivityPresentation = Pick<IssueActivityItem, 'id' | 'createdAt' | 'actionType' | 'actionDescription'> &
  Partial<Omit<IssueActivityItem, 'Comment' | 'ModerationProfile'>> & {
    Comment?: (Pick<ActivityComment, 'id' | 'text' | 'createdAt'> & Partial<Omit<ActivityComment, 'id' | 'text' | 'createdAt'>>) | null;
    ModerationProfile?: (Pick<ActivityModerator, 'displayName'> & Partial<Omit<ActivityModerator, 'displayName'>>) | null;
  };
