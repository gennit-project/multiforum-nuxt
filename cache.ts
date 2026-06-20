import type {
  FieldMergeFunction,
  InMemoryCacheConfig,
  Reference,
  StoreObject,
} from '@apollo/client/core';
import { ref } from 'vue';
import { config } from './config';

type CacheEntity = Reference | StoreObject;

const mergeSuspendedUsers: FieldMergeFunction<CacheEntity[]> = (
  existing = [],
  incoming = [],
  { mergeObjects, readField }
) => {
  if (!incoming.length) {
    return incoming;
  }

  return incoming.map((incomingSuspension) => {
    const incomingId = readField('id', incomingSuspension);
    const incomingUsername = readField('username', incomingSuspension);
    const existingSuspension = existing.find((suspension) => {
      const existingId = readField('id', suspension);
      const existingUsername = readField('username', suspension);
      return incomingId
        ? existingId === incomingId
        : existingUsername === incomingUsername;
    });

    return existingSuspension
      ? mergeObjects(existingSuspension, incomingSuspension)
      : incomingSuspension;
  });
};

// Channel.Moderators and Channel.Admins are each written by several queries with
// DIFFERENT sub-selections (e.g. some include `User { username }`, others only
// `displayName`). Without a merge function Apollo replaces the array
// last-writer-wins and logs "Cache data may be lost when replacing the <field>
// field". Because those writers resolve in a different order during SSR vs. client
// hydration, the restored list could differ from the server-rendered one, flipping
// the "Forum Mod"/"Forum Admin" badge and producing a hydration mismatch.
//
// Merge by the entity's keyField so the result is a union that is independent of
// write order and accumulates fields. This is strictly safer than a `[...incoming]`
// replace because it never drops an entry that a partial/filtered write omits.
const mergeByKeyField = (
  keyField: string
): FieldMergeFunction<CacheEntity[]> => {
  return (existing = [], incoming = [], { mergeObjects, readField }) => {
    const merged: CacheEntity[] = existing.slice();
    const indexByKey = new Map<string, number>();
    existing.forEach((entity, index) => {
      const key = readField(keyField, entity);
      if (typeof key === 'string') {
        indexByKey.set(key, index);
      }
    });

    incoming.forEach((incomingEntity) => {
      const key = readField(keyField, incomingEntity);
      const existingIndex =
        typeof key === 'string' ? indexByKey.get(key) : undefined;

      const existingEntity =
        existingIndex === undefined ? undefined : merged[existingIndex];

      if (existingIndex === undefined || existingEntity === undefined) {
        if (typeof key === 'string') {
          indexByKey.set(key, merged.length);
        }
        merged.push(incomingEntity);
      } else {
        merged[existingIndex] = mergeObjects(existingEntity, incomingEntity);
      }
    });

    return merged;
  };
};

// ModerationProfile is keyed by displayName; User (Admins) is keyed by username.
const mergeModerators = mergeByKeyField('displayName');
const mergeAdmins = mergeByKeyField('username');

export const usernameVar = ref('');
export const setUsername = (username: string) => {
  usernameVar.value = username;
};
// The verified email from the server session. Seeded by plugins/auth-session.ts.
// Used by the create-username flow (which keys the new User node off the email).
export const emailVar = ref('');
export const setEmail = (email: string) => {
  emailVar.value = email;
};
export const profilePicURLVar = ref('');
export const setProfilePicURL = (url: string) => {
  profilePicURLVar.value = url;
};
export const userDataLoadingVar = ref(false);
export const modProfileNameVar = ref('');
export const setModProfileName = (modProfileName: string) => {
  modProfileNameVar.value = modProfileName;
};
export const isAuthenticatedVar = ref(false);
export const setIsAuthenticated = (status: boolean) => {
  if (status === isAuthenticatedVar.value) {
    return; // No change in authentication status, skip update
  }
  isAuthenticatedVar.value = status;
};

export const isLoadingAuthVar = ref(false);
export const setIsLoadingAuth = (status: boolean) => {
  isLoadingAuthVar.value = status;
};

export const notificationCountVar = ref(0);
export const setNotificationCount = (count: number) => {
  notificationCountVar.value = count;
};

export const sideNavIsOpenVar = ref(false);
export const setSideNavIsOpenVar = (status: boolean) => {
  // Necessary to prevent a bug in which the event list
  // event listeners interfere with navigation to the links
  // in the side nav. This state is used to turn off the
  // event listeners in the event list when the side nav is open.
  sideNavIsOpenVar.value = status;
};

export const enteredDevelopmentEnvironmentVar = ref(
  config.environment === 'development'
);
export const setEnteredDevelopmentEnvironment = (status: boolean) => {
  enteredDevelopmentEnvironmentVar.value = status;
};

export const inMemoryCacheOptions: InMemoryCacheConfig = {
  typePolicies: {
    Tag: {
      merge: true,
      keyFields: ['text'],
    },
    ServerConfig: {
      keyFields: ['serverName'],
    },
    ModerationProfile: {
      keyFields: ['displayName'],
      merge: true,
      fields: {
        ActivityFeed: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        AuthoredIssues: {
          merge: (_existing = [], incoming) => [...incoming],
        },
      },
    },
    Channel: {
      keyFields: ['uniqueName'],
      merge: true,
      fields: {
        Tags: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Admins: {
          merge: mergeAdmins,
        },
        Moderators: {
          merge: mergeModerators,
        },
        SuspendedUsers: {
          merge: mergeSuspendedUsers,
        },
      },
    },
    Discussion: {
      keyFields: ['id'],
      merge: true,
      fields: {
        Tags: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        DiscussionChannels: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Author: {
          merge: true,
        },
        Channel: {
          merge: true,
        },
        Album: {
          merge: true,
        },
      },
    },
    Comment: {
      keyFields: ['id'],
      merge: true,
      fields: {
        CommentAuthor: {
          merge: true,
        },
        UpvotedByUsers: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        FeedbackComments: {
          merge: (_existing = [], incoming) => [...incoming],
        },
      },
    },
    CommentsAggregate: {
      keyFields: false,
    },
    Event: {
      keyFields: ['id'],
      merge: true,
      fields: {
        Tags: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        EventChannels: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Channels: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Poster: {
          merge: true,
        },
      },
    },
    DiscussionChannel: {
      merge: true,
      fields: {
        UpvotedByUsers: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Channel: {
          merge: true,
        },
        Comments: {
          merge: (_existing = [], incoming) => [...incoming],
        },
      },
    },
    User: {
      keyFields: ['username'],
      merge: true,
      fields: {
        Discussions: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Comments: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        Events: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        UpvotedComments: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        UpvotedDiscussions: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        UpvotedEvents: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        ModProfiles: {
          merge: (_existing = [], incoming) => [...incoming],
        },
        ChannelRoles: {
          merge: (_existing = [], incoming) => [...incoming],
        },
      },
    },
    ChannelRole: {
      merge: true,
    },
    Album: {
      keyFields: ['id'],
      merge: true,
      fields: {
        Images: {
          merge: (existing = [], incoming) => {
            // Handle case where incoming is an empty object instead of array
            if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
              const keys = Object.keys(incoming);
              if (keys.length === 0) {
                // Preserve existing images when incoming is empty object
                return existing;
              }
              // Convert object with numeric keys to array
              if (keys.every(k => !isNaN(Number(k)))) {
                return keys.sort((a, b) => Number(a) - Number(b)).map(k => incoming[k]);
              }
            }
            // If incoming is an empty array but we have existing images, preserve them
            // This prevents cache updates from wiping out existing image data
            if (Array.isArray(incoming) && incoming.length === 0 && existing.length > 0) {
              return existing;
            }
            return Array.isArray(incoming) ? [...incoming] : existing;
          },
        },
      },
    },
    Query: {},
  },
};
