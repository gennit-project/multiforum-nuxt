// Contribution data fixture for testing GithubContributionChart component
import type { DayData } from '@/types/contribution';
import type { User, Comment, Discussion, Event } from '@/__generated__/graphql';

// Create a stable date for testing that won't change with the current date
const TEST_YEAR = 2023;

// Helper to create minimal test user data
const createTestUser = (username: string): User =>
  ({
    id: `user-${username}`,
    username,
    displayName: username,
    email: `${username}@test.com`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as unknown as User;

// Helper to create minimal test comment data
const createTestComment = (id: string, text: string, author: User): Comment =>
  ({
    id,
    text,
    CommentAuthor: author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as unknown as Comment;

// Helper to create minimal test discussion data
const createTestDiscussion = (
  id: string,
  title: string,
  author: User
): Discussion =>
  ({
    id,
    title,
    Author: author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as unknown as Discussion;

// Helper to create minimal test event data
const createTestEvent = (id: string, title: string, poster: User): Event =>
  ({
    id,
    title,
    Poster: poster,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as unknown as Event;

// Helper to create a date string in ISO format
const createDateString = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Create a sparse activity array for testing
export const contributionDataFixture: DayData[] = [
  // January data - a few days with activity
  {
    date: createDateString(TEST_YEAR, 1, 3),
    count: 2,
    activities: [
      {
        id: 'activity-1',
        type: 'Comment',
        description: 'Added a comment',
        Comments: [
          createTestComment(
            'comment-1',
            'Test comment content',
            createTestUser('testuser')
          ),
        ],
      },
    ],
  },
  {
    date: createDateString(TEST_YEAR, 1, 10),
    count: 4,
    activities: [
      {
        id: 'activity-2',
        type: 'Discussion',
        description: 'Created a discussion',
        Discussions: [
          createTestDiscussion(
            'discussion-1',
            'Test discussion',
            createTestUser('testuser')
          ),
        ],
      },
    ],
  },
  // February with some higher activity
  {
    date: createDateString(TEST_YEAR, 2, 15),
    count: 5,
    activities: [
      {
        id: 'activity-3',
        type: 'Event',
        description: 'Created an event',
        Events: [
          createTestEvent('event-1', 'Test event', createTestUser('testuser')),
        ],
      },
    ],
  },
  // March with mixed activity types
  {
    date: createDateString(TEST_YEAR, 3, 22),
    count: 3,
    activities: [
      {
        id: 'activity-4',
        type: 'Mixed',
        description: 'Multiple activities',
        Comments: [
          createTestComment(
            'comment-2',
            'Another comment',
            createTestUser('testuser')
          ),
        ],
        Discussions: [
          createTestDiscussion(
            'discussion-2',
            'Another discussion',
            createTestUser('testuser')
          ),
        ],
      },
    ],
  },
  // June with zero count but activities - edge case
  {
    date: createDateString(TEST_YEAR, 6, 14),
    count: 0,
    activities: [],
  },
];

// A set of data points with no activities - empty chart
export const emptyContributionData: DayData[] = [];

// A set of data with activity on consecutive days
export const consecutiveDaysContributionData: DayData[] = [
  {
    date: createDateString(TEST_YEAR, 4, 10),
    count: 1,
    activities: [{ id: 'activity-5', type: 'Comment', description: 'Day 1' }],
  },
  {
    date: createDateString(TEST_YEAR, 4, 11),
    count: 2,
    activities: [{ id: 'activity-6', type: 'Comment', description: 'Day 2' }],
  },
  {
    date: createDateString(TEST_YEAR, 4, 12),
    count: 3,
    activities: [{ id: 'activity-7', type: 'Comment', description: 'Day 3' }],
  },
];

// Data with one activity with all three types - comments, discussions, events
export const allTypesContributionData: DayData[] = [
  {
    date: createDateString(TEST_YEAR, 5, 15),
    count: 3,
    activities: [
      {
        id: 'activity-8',
        type: 'All',
        description: 'All activity types',
        Comments: [
          createTestComment(
            'comment-3',
            'Comment content',
            createTestUser('testuser')
          ),
        ],
        Discussions: [
          createTestDiscussion(
            'discussion-3',
            'Discussion title',
            createTestUser('testuser')
          ),
        ],
        Events: [
          createTestEvent('event-3', 'Event title', createTestUser('testuser')),
        ],
      },
    ],
  },
];
