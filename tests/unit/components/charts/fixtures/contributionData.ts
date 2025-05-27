// Contribution data fixture for testing GithubContributionChart component

// Create a stable date for testing that won't change with the current date
const TEST_YEAR = 2023;

// Helper to create a date string in ISO format
const createDateString = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Create a sparse activity array for testing
export const contributionDataFixture = [
  // January data - a few days with activity
  {
    date: createDateString(TEST_YEAR, 1, 3),
    count: 2,
    activities: [
      {
        id: "activity-1",
        type: "Comment",
        description: "Added a comment",
        Comments: [
          {
            id: "comment-1",
            content: "Test comment content",
            User: { username: "testuser" }
          }
        ]
      }
    ]
  },
  {
    date: createDateString(TEST_YEAR, 1, 10),
    count: 4,
    activities: [
      {
        id: "activity-2",
        type: "Discussion",
        description: "Created a discussion",
        Discussions: [
          {
            id: "discussion-1",
            title: "Test discussion",
            User: { username: "testuser" }
          }
        ]
      }
    ]
  },
  // February with some higher activity
  {
    date: createDateString(TEST_YEAR, 2, 15),
    count: 5,
    activities: [
      {
        id: "activity-3",
        type: "Event",
        description: "Created an event",
        Events: [
          {
            id: "event-1",
            title: "Test event",
            User: { username: "testuser" }
          }
        ]
      }
    ]
  },
  // March with mixed activity types
  {
    date: createDateString(TEST_YEAR, 3, 22),
    count: 3,
    activities: [
      {
        id: "activity-4",
        type: "Mixed",
        description: "Multiple activities",
        Comments: [{ id: "comment-2", content: "Another comment", User: { username: "testuser" } }],
        Discussions: [{ id: "discussion-2", title: "Another discussion", User: { username: "testuser" } }]
      }
    ]
  },
  // June with zero count but activities - edge case
  {
    date: createDateString(TEST_YEAR, 6, 14),
    count: 0,
    activities: []
  }
];

// A set of data points with no activities - empty chart
export const emptyContributionData = [];

// A set of data with activity on consecutive days
export const consecutiveDaysContributionData = [
  {
    date: createDateString(TEST_YEAR, 4, 10),
    count: 1,
    activities: [{ id: "activity-5", type: "Comment", description: "Day 1" }]
  },
  {
    date: createDateString(TEST_YEAR, 4, 11),
    count: 2,
    activities: [{ id: "activity-6", type: "Comment", description: "Day 2" }]
  },
  {
    date: createDateString(TEST_YEAR, 4, 12),
    count: 3,
    activities: [{ id: "activity-7", type: "Comment", description: "Day 3" }]
  }
];

// Data with one activity with all three types - comments, discussions, events
export const allTypesContributionData = [
  {
    date: createDateString(TEST_YEAR, 5, 15),
    count: 3,
    activities: [
      {
        id: "activity-8",
        type: "All",
        description: "All activity types",
        Comments: [{ id: "comment-3", content: "Comment content", User: { username: "testuser" } }],
        Discussions: [{ id: "discussion-3", title: "Discussion title", User: { username: "testuser" } }],
        Events: [{ id: "event-3", title: "Event title", User: { username: "testuser" } }]
      }
    ]
  }
];