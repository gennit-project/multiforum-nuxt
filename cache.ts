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
      keyFields: ["serverName"]
    },
    ModerationProfile: {
      keyFields: ["displayName"],
      merge: true,
      fields: {
        ActivityFeed: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        AuthoredIssues: {
          merge: (_, incoming) => [...incoming],
        },
      },
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        AuthoredIssues: {
          merge: (existing = [], incoming) => [...incoming]
        }
      }
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    Channel: {
      keyFields: ["uniqueName"],
      merge: true,
      fields: {
        Tags: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        Admins: {
          merge: (_, incoming) => [...incoming],
        },
      },
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        Admins: {
          merge: (existing = [], incoming) => [...incoming]
        }
      }
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    Discussion: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        DiscussionChannels: {
          merge: (_, incoming) => [...incoming],
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        DiscussionChannels: {
          merge: (existing = [], incoming) => [...incoming]
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        },
        Author: {
          merge: true
        },
        Channel: {
          merge: true
        }
      }
    },
    Comment: {
      keyFields: ["id"],
      merge: true,
      fields: {
        CommentAuthor: {
          merge: true
        },
        UpvotedByUsers: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        FeedbackComments: {
          merge: (_, incoming) => [...incoming],
        },
      },
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        FeedbackComments: {
          merge: (existing = [], incoming) => [...incoming]
        }
      }
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    CommentsAggregate: {
      keyFields: false,
    },
    Event: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        EventChannels: {
          merge: (_, incoming) => [...incoming],
        },
        Channels: {
          merge: (_, incoming) => [...incoming],
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        EventChannels: {
          merge: (existing = [], incoming) => [...incoming]
        },
        Channels: {
          merge: (existing = [], incoming) => [...incoming]
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        },
        Poster: {
          merge: true
        }
      }
    },
    DiscussionChannel: {
      merge: true,
      fields: {
        UpvotedByUsers: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
=======
          merge: (existing = [], incoming) => [...incoming]
>>>>>>> parent of 666ae3d (Use automated formatting tools)
        },
        Channel: {
          merge: true
        },
        Comments: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
      },
=======
          merge: (existing = [], incoming) => [...incoming]
        }
      }
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    User: {
      keyFields: ["username"],
      merge: true,
      fields: {
        Discussions: {
<<<<<<< HEAD
          merge: (_, incoming) => [...incoming],
        },
        Comments: {
          merge: (_, incoming) => [...incoming],
        },
        Events: {
          merge: (_, incoming) => [...incoming],
        },
        UpvotedComments: {
          merge: (_, incoming) => [...incoming],
        },
        UpvotedDiscussions: {
          merge: (_, incoming) => [...incoming],
        },
        UpvotedEvents: {
          merge: (_, incoming) => [...incoming],
        },
        ModProfiles: {
          merge: (_, incoming) => [...incoming],
        },
        ChannelRoles: {
          merge: (_, incoming) => [...incoming],
        },
      },
=======
          merge: (existing = [], incoming) => [...incoming]
        },
        Comments: {
          merge: (existing = [], incoming) => [...incoming]
        },
        Events: {
          merge: (existing = [], incoming) => [...incoming]
        },
        UpvotedComments: {
          merge: (existing = [], incoming) => [...incoming]
        },
        UpvotedDiscussions: {
          merge: (existing = [], incoming) => [...incoming]
        },
        UpvotedEvents: {
          merge: (existing = [], incoming) => [...incoming]
        },
        ModProfiles: {
          merge: (existing = [], incoming) => [...incoming]
        },
        ChannelRoles: {
          merge: (existing = [], incoming) => [...incoming]
        }
      }
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    ChannelRole: {
      merge: true
    },
    Query: {}
  }
};