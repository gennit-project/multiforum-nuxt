export type ModRole = {
  name: string;
  description: string;
  canReport: boolean;
  canHideComment: boolean;
  canHideDiscussion: boolean;
  canHideEvent: boolean;
  canLockChannel: boolean;
  canEditComments: boolean;
  canEditDiscussions: boolean;
  canEditEvents: boolean;
  canGiveFeedback: boolean;
  canOpenSupportTickets: boolean;
  canCloseSupportTickets: boolean;
  canSuspendUser: boolean;
  canArchiveImage: boolean;
  canDeleteWiki: boolean;
};

export type Rule = {
  summary: string;
  detail: string;
};

export const DEFAULT_MOD_ROLE: ModRole = {
  name: 'Moderator',
  description: '',
  canReport: true,
  canHideComment: true,
  canHideDiscussion: true,
  canHideEvent: true,
  canLockChannel: false,
  canEditComments: true,
  canEditDiscussions: true,
  canEditEvents: true,
  canGiveFeedback: true,
  canOpenSupportTickets: true,
  canCloseSupportTickets: true,
  canSuspendUser: true,
  canArchiveImage: true,
  canDeleteWiki: true,
};

export const DEFAULT_RULES: Rule[] = [
  {
    summary: 'Be kind',
    detail: 'Keep the forum civil.',
  },
];

export const createRulesJSON = (rules: Rule[]): string => JSON.stringify(rules);

export const DEFAULT_RULES_JSON = createRulesJSON(DEFAULT_RULES);

/**
 * A limited mod role that only has feedback permissions.
 * Useful for testing feedback flows without full moderation capabilities.
 */
export const FEEDBACK_MOD_ROLE: ModRole = {
  name: 'feedback-mod',
  description: 'Can give feedback',
  canReport: true,
  canHideComment: false,
  canHideDiscussion: false,
  canHideEvent: false,
  canLockChannel: false,
  canEditComments: false,
  canEditDiscussions: false,
  canEditEvents: false,
  canGiveFeedback: true,
  canOpenSupportTickets: false,
  canCloseSupportTickets: false,
  canSuspendUser: false,
  canArchiveImage: false,
  canDeleteWiki: false,
};
