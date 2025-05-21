import type { InMemoryCacheConfig } from "@apollo/client/core";
import { ref } from "vue";
import { config } from "./config";

export const usernameVar = ref("");
export const setUsername = (username: string) => {
  usernameVar.value = username;
};
export const profilePicURLVar = ref("");
export const setProfilePicURL = (url: string) => {
  profilePicURLVar.value = url;
};
export const userDataLoadingVar = ref(false);
export const setUserDataLoading = (status: boolean) => {
  userDataLoadingVar.value = status;
};
export const modProfileNameVar = ref("");
export const setModProfileName = (modProfileName: string) => {
  modProfileNameVar.value = modProfileName;
};
export const isAuthenticatedVar = ref(false);
export const setIsAuthenticated = (status: boolean) => {
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

export const enteredDevelopmentEnvironmentVar = ref(config.environment === "development");
export const setEnteredDevelopmentEnvironment = (status: boolean) => {
  enteredDevelopmentEnvironmentVar.value = status;
};

export const inMemoryCacheOptions: InMemoryCacheConfig = {
  typePolicies: {
    Tag: {
      merge: true,
      keyFields: ["text"],
    },
    ServerConfig: {
      keyFields: ["serverName"],
    },
    ModerationProfile: {
      keyFields: ["displayName"],
      merge: true,
      fields: {
        ActivityFeed: {
          merge: (existing = [], incoming) => [...incoming],
        },
        AuthoredIssues: {
          merge: (existing = [], incoming) => [...incoming],
        },
      },
    },
    Channel: {
      keyFields: ["uniqueName"],
      merge: true,
      fields: {
        Tags: {
          merge: (existing = [], incoming) => [...incoming],
        },
        Admins: {
          merge: (existing = [], incoming) => [...incoming],
        },
      },
    },
    Discussion: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: {
          merge: (existing = [], incoming) => [...incoming],
        },
        DiscussionChannels: {
          merge: (existing = [], incoming) => [...incoming],
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
      keyFields: ["id"],
      merge: true,
      fields: {
        CommentAuthor: {
          merge: true,
        },
        UpvotedByUsers: {
          merge: (existing = [], incoming) => [...incoming],
        },
        FeedbackComments: {
          merge: (existing = [], incoming) => [...incoming],
        },
      },
    },
    CommentsAggregate: {
      keyFields: false,
    },
    Event: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: {
          merge: (existing = [], incoming) => [...incoming],
        },
        EventChannels: {
          merge: (existing = [], incoming) => [...incoming],
        },
        Channels: {
          merge: (existing = [], incoming) => [...incoming],
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
          merge: (existing = [], incoming) => [...incoming],
        },
        Channel: {
          merge: true,
        },
        Comments: {
          merge: (existing = [], incoming) => [...incoming],
        },
      },
    },
    User: {
      keyFields: ["username"],
      merge: true,
      fields: {
        Discussions: {
          merge: (existing = [], incoming) => [...incoming],
        },
        Comments: {
          merge: (existing = [], incoming) => [...incoming],
        },
        Events: {
          merge: (existing = [], incoming) => [...incoming],
        },
        UpvotedComments: {
          merge: (existing = [], incoming) => [...incoming],
        },
        UpvotedDiscussions: {
          merge: (existing = [], incoming) => [...incoming],
        },
        UpvotedEvents: {
          merge: (existing = [], incoming) => [...incoming],
        },
        ModProfiles: {
          merge: (existing = [], incoming) => [...incoming],
        },
        ChannelRoles: {
          merge: (existing = [], incoming) => [...incoming],
        },
      },
    },
    ChannelRole: {
      merge: true,
    },
    Query: {},
  },
};
