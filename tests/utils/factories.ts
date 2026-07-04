import type {
  Album,
  Channel,
  Comment,
  Discussion,
  DiscussionChannel,
  Event,
  EventChannel,
  Issue,
  ModerationProfile,
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
 * Overrides are `DeepPartial`, so nested relations can be supplied partially
 * (e.g. `Author: { username: 'alice' }`) without any per-call `as` cast — the
 * single unavoidable cast onto the strict generated type lives here, once per
 * factory, instead of being scattered across every spec.
 *
 *   const channel = makeChannel({ uniqueName: 'cats' });
 *   const events = [makeEvent({ id: '1' }), makeEvent({ id: '2' })];
 *   const issue = makeIssue({ issueNumber: 7, Channel: { uniqueName: 'cats' } });
 */

/**
 * Recursively-optional version of a type. Unlike the built-in `Partial<T>`
 * (which only makes the top level optional while keeping each value's full
 * required shape), this lets fixtures supply nested relation objects partially.
 * Keys are still checked, so typos in override field names remain errors.
 */
export type DeepPartial<T> = T extends (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** Stable timestamp so snapshots/assertions are deterministic. */
export const MOCK_DATE = '2024-01-01T00:00:00.000Z';

export function makeUser(overrides: DeepPartial<User> = {}): User {
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

export function makeChannel(overrides: DeepPartial<Channel> = {}): Channel {
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
  overrides: DeepPartial<Discussion> = {}
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

export function makeEvent(overrides: DeepPartial<Event> = {}): Event {
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

export function makeComment(overrides: DeepPartial<Comment> = {}): Comment {
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

export function makeAlbum(overrides: DeepPartial<Album> = {}): Album {
  return {
    __typename: 'Album',
    id: 'test-album-1',
    imageOrder: [],
    Images: [],
    ...overrides,
  } as Album;
}

export function makeIssue(overrides: DeepPartial<Issue> = {}): Issue {
  return {
    __typename: 'Issue',
    id: 'test-issue-1',
    issueNumber: 1,
    title: 'Test Issue',
    body: 'Issue body',
    isOpen: true,
    locked: false,
    createdAt: MOCK_DATE,
    ...overrides,
  } as Issue;
}

export function makeModerationProfile(
  overrides: DeepPartial<ModerationProfile> = {}
): ModerationProfile {
  return {
    __typename: 'ModerationProfile',
    displayName: 'TestMod',
    createdAt: MOCK_DATE,
    ...overrides,
  } as ModerationProfile;
}

export function makeEventChannel(
  overrides: DeepPartial<EventChannel> = {}
): EventChannel {
  return {
    __typename: 'EventChannel',
    id: 'test-event-channel-1',
    eventId: 'test-event-1',
    channelUniqueName: 'test-forum',
    archived: false,
    createdAt: MOCK_DATE,
    ...overrides,
  } as EventChannel;
}

export function makeDiscussionChannel(
  overrides: DeepPartial<DiscussionChannel> = {}
): DiscussionChannel {
  return {
    __typename: 'DiscussionChannel',
    id: 'test-discussion-channel-1',
    discussionId: 'test-discussion-1',
    channelUniqueName: 'test-forum',
    archived: false,
    createdAt: MOCK_DATE,
    ...overrides,
  } as DiscussionChannel;
}
