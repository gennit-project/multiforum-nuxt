import type {
  GetCommentSectionQuery,
  GetDiscussionDetailQuery,
  GetDownloadDetailQuery,
  GetDiscussionQuery,
  GetDiscussionDetailAnswersPageQuery,
} from '@/__generated__/operations';
import type { NullableSelection } from './Comment';

export type RootCommentSection = NonNullable<
  GetCommentSectionQuery['getCommentSection']
>;
export type RootComment = RootCommentSection['Comments'][number];
export type AnswerSummary = NonNullable<
  GetDiscussionDetailAnswersPageQuery['getDiscussionDetailAnswers']
>['answers'][number];
type Detail = GetDiscussionDetailQuery['discussions'][number];
type FullRead = GetDiscussionQuery['discussions'][number];
type RootChannel = NonNullable<RootCommentSection['DiscussionChannel']>;
type DetailChannel = Detail['DiscussionChannels'][number];
type ChannelFeatures = NonNullable<RootChannel['Channel']>;
// These shared inputs also receive legacy schema entities and detail fallbacks.
// Nullable selections may be omitted; query/cache result types stay exact.
export type CommentChannelView = NullableSelection<
  Omit<
    RootChannel,
    | 'RootCommentsConnection'
    | 'SubscribedToNotifications'
    | 'Answers'
    | 'Channel'
    | 'Discussion'
    | 'detailAnswersPageInfo'
  >
> &
  Partial<
    NullableSelection<
      Pick<
        RootChannel,
        | 'RootCommentsConnection'
        | 'SubscribedToNotifications'
        | 'Answers'
        | 'detailAnswersPageInfo'
      >
    >
  > & {
    Channel?:
      | (NullableSelection<Omit<ChannelFeatures, 'Bots' | 'Moderators'>> &
          Partial<
            NullableSelection<Pick<ChannelFeatures, 'Bots' | 'Moderators'>>
          > &
          Partial<
            NullableSelection<
              Pick<
                NonNullable<DetailChannel['Channel']>,
                'displayName' | 'channelIconURL'
              >
            >
          >)
      | null;
    Discussion?:
      | (Pick<NonNullable<RootChannel['Discussion']>, 'id'> &
          Partial<
            NullableSelection<
              Omit<NonNullable<RootChannel['Discussion']>, 'id'>
            >
          >)
      | null;
    LabelOptions?: NullableSelection<
      GetDownloadDetailQuery['discussions'][number]['DiscussionChannels'][number]['LabelOptions']
    >;
    Flairs?: NullableSelection<DetailChannel['Flairs']>;
  };
export type DiscussionPresentation = Omit<
  NullableSelection<Detail>,
  'DiscussionChannels'
> & {
  DiscussionChannels: CommentChannelView[];
} & Partial<
    NullableSelection<
      Pick<
        FullRead,
        | 'PastTitleVersions'
        | 'PastBodyVersions'
        | 'BodyLastEditedBy'
        | 'isFavorited'
        | 'editReason'
        | 'authorIsChannelModerator'
      >
    >
  >;
export type DetailImage = NonNullable<Detail['Album']>['Images'][number];
export type DetailFile = Detail['DownloadableFiles'][number];
export type DetailResult = GetDiscussionDetailQuery | GetDownloadDetailQuery;

export type PresentationAlbum = NullableSelection<
  NonNullable<Detail['CrosspostedDiscussion']>['Album']
>;
export type PresentationImage =
  NonNullable<PresentationAlbum>['Images'][number];

export type PresentationLabel = NullableSelection<
  GetDownloadDetailQuery['discussions'][number]['DiscussionChannels'][number]['LabelOptions'][number]
>;
export type PresentationRevision = NonNullable<
  DiscussionPresentation['PastBodyVersions']
>[number];
