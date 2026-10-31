import type { TagData } from './Tag';

// The recursive renderer consumes the actual shared selection, not a schema
// entity. Legacy event/feedback/issue callers may additionally supply context;
// these optional schema-derived fields are tracked in the migration inventory.
import type { Comment as SchemaComment, User } from '@/__generated__/graphql';
import type {
  CommentFieldsFragment,
  GetCommentWithRepliesQuery,
} from '@/__generated__/operations';

export enum ActionType {
  Close = 'close',
  Comment = 'comment',
  Archive = 'archive',
  Remove = 'remove',
  Delete = 'delete',
  Edit = 'edit',
  Reopen = 'reopen',
  Report = 'report',
  Suspension = 'suspension',
  Unarchive = 'un-archive',
  Unsuspend = 'unsuspend',
}

export type CreateEditCommentFormValues = {
  depth: number;
  parentCommentId?: string;
  text: string;
  tags?: [TagData];
  isRootComment?: boolean;
};

export type CreateReplyInputData = {
  parentCommentId: string;
  text: string;
  depth: number;
};

export type ReplyComment = NonNullable<
  GetCommentWithRepliesQuery['getCommentReplies']
>['ChildComments'][number];
// Legacy schema types permit omission of nullable fields. Preserve that at the
// shared UI boundary while keeping non-null selected fields required. Query
// results themselves remain the exact generated operation types.
export type NullableSelection<T> = T extends readonly (infer Item)[]
  ? NullableSelection<Item>[]
  : T extends object
    ? {
        [K in keyof T as null extends T[K] ? never : K]: NullableSelection<
          T[K]
        >;
      } & {
        [K in keyof T as null extends T[K] ? K : never]?: NullableSelection<
          T[K]
        >;
      }
    : T;
type SelectedComment = NullableSelection<CommentFieldsFragment>;
type Author = NonNullable<SelectedComment['CommentAuthor']> &
  Pick<NonNullable<SchemaComment['CommentAuthor']>, '__typename'> &
  Partial<Pick<User, 'displayName'>>;

type ChannelContext = Pick<NonNullable<SchemaComment['Channel']>, 'uniqueName'>;
type EventContext = Pick<NonNullable<SchemaComment['Event']>, 'id'> & {
  EventChannels?: Array<
    Pick<
      NonNullable<SchemaComment['Event']>['EventChannels'][number],
      'channelUniqueName'
    >
  >;
};
type FeedbackCommentContext = Pick<SchemaComment, 'id'> & {
  DiscussionChannel?: Pick<
    NonNullable<SchemaComment['DiscussionChannel']>,
    'discussionId'
  > | null;
  Event?: Pick<NonNullable<SchemaComment['Event']>, 'id'> | null;
};

export type CommentView = Omit<SelectedComment, 'CommentAuthor' | 'Event'> & {
  CommentAuthor?: Author | null;
  Event?: EventContext | null;
  Channel?: ChannelContext | null;
  Issue?:
    | (Pick<
        NonNullable<SchemaComment['Issue']>,
        'issueNumber' | 'channelUniqueName'
      > & {
        Channel?: ChannelContext | null;
      })
    | null;
  GivesFeedbackOnComment?: FeedbackCommentContext | null;
  GivesFeedbackOnDiscussion?: Pick<
    NonNullable<SchemaComment['GivesFeedbackOnDiscussion']>,
    'id'
  > | null;
  GivesFeedbackOnEvent?: EventContext | null;
} & Partial<Pick<ReplyComment, 'FeedbackComments'>> &
  Partial<Pick<SchemaComment, 'FeedbackCommentsConnection'>>;
