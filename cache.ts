import type { InMemoryCacheConfig } from '@apollo/client/core';
import { ref } from 'vue';
import { config } from './config';

export const usernameVar = ref('');
export const setUsername = (username: string) => {
  usernameVar.value = username;
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
          merge: (_existing = [], incoming) => [...incoming],
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
    Query: {},
  },
};
