// Shared types for contribution chart components
import type {
  Comment as CommentType,
  Discussion as DiscussionType,
  Event as EventType,
} from '@/__generated__/graphql';

// Define the activity type for contribution charts
export interface Activity {
  id: string;
  type: string;
  description: string;
  Comments?: CommentType[];
  Discussions?: DiscussionType[];
  Events?: EventType[];
}

// Define the day data type for contribution charts
export interface DayData {
  date: string;
  count: number;
  activities: Activity[];
}
