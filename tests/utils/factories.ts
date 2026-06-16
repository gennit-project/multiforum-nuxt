import type {
  Channel,
  Comment,
  Discussion,
  Event,
  User,
} from '@/__generated__/graphql';

/**
 * Typed fixture factories for the core GraphQL entities.
 *
 * The generated types have dozens of required relation fields, so building a
 * fully-valid object inline is impractical. These factories populate the
 * commonly-used scalar fields with sane defaults, accept partial overrides,
 * and cast to the full type — matching how specs already hand-roll fixtures,
 * but without the repetition.
 *
 *   const channel = makeChannel({ uniqueName: 'cats' });
 *   const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' })];
 */

/** Stable timestamp so snapshots/assertions are deterministic. */
export const MOCK_DATE = '2024-01-01T00:00:00.000Z';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    __typename: 'User',
    username: 'testuser',
    displayName: 'Test User',
    profilePicURL: '',
    createdAt: MOCK_DATE,
    commentKarma: 0,
    discussionKarma: 0,
    ...overrides,
  } as User;
}

export function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    __typename: 'Channel',
    uniqueName: 'test-forum',
    displayName: 'Test Forum',
    description: 'A test forum',
    channelIconURL: '',
    createdAt: MOCK_DATE,
    deleted: false,
    locked: false,
    eventsEnabled: true,
    downloadsEnabled: true,
    feedbackEnabled: true,
    wikiEnabled: true,
    ...overrides,
  } as Channel;
}

export function makeDiscussion(
  overrides: Partial<Discussion> = {}
): Discussion {
  return {
    __typename: 'Discussion',
    id: 'test-discussion-1',
    title: 'Test Discussion',
    body: 'Discussion body',
    bookmarkCount: 0,
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    hasDownload: false,
    deleted: false,
    // Common relations components iterate over; default empty to avoid crashes.
    DiscussionChannels: [],
    Tags: [],
    ...overrides,
  } as Discussion;
}

export function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    __typename: 'Event',
    id: 'test-event-1',
    title: 'Test Event',
    description: 'Event description',
    startTime: MOCK_DATE,
    endTime: MOCK_DATE,
    createdAt: MOCK_DATE,
    canceled: false,
    locationName: '',
    address: '',
    virtualEventUrl: '',
    location: null,
    // Common relations components iterate over; default empty to avoid crashes.
    EventChannels: [],
    Tags: [],
    ...overrides,
  } as Event;
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    __typename: 'Comment',
    id: 'test-comment-1',
    text: 'A comment',
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    isRootComment: true,
    archived: false,
    deleted: false,
    ...overrides,
  } as Comment;
}
