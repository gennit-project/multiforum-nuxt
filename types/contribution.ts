// Shared types for contribution chart components
import type {
  Comment as CommentType,
  Discussion as DiscussionType,
  Event as EventType,
  TextVersion as TextVersionType,
  WikiPage as WikiPageType,
} from '@/__generated__/graphql';

type WikiEditType = TextVersionType & {
  WikiPage?: Pick<
    WikiPageType,
    'id' | 'title' | 'slug' | 'channelUniqueName'
  > | null;
};

// Define the activity type for contribution charts
export interface Activity {
  id: string;
  type: string;
  description: string;
  Comments?: CommentType[];
  Discussions?: DiscussionType[];
  Events?: EventType[];
  WikiEdits?: WikiEditType[];
}

// Define the day data type for contribution charts
export interface DayData {
  date: string;
  count: number;
  activities: Activity[];
}
