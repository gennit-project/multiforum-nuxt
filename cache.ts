import type { InMemoryCacheConfig, ReactiveVar } from "@apollo/client/core";
import { makeVar } from "@apollo/client/core";
import { ref } from "vue";

export const usernameVar = ref("");
export const setUsername = (username: string) => {
  usernameVar.value = username;
};
export const modProfileNameVar = ref("default");
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
export const themeVar: ReactiveVar<string> = makeVar<string>(
  import.meta.client ? localStorage.getItem("theme") || "dark" : "dark"
);

export const inMemoryCacheOptions: InMemoryCacheConfig = {
  typePolicies: {
    Tag: {
      keyFields: ["text"],
    },
    Channel: {
      keyFields: ["uniqueName"],
      fields: {
        Tags: { merge: false },
        Admins: { merge: false },
      },
    },
    Discussion: {
      keyFields: ["id"],
      fields: {
        Tags: { merge: false },
        DiscussionChannels: { merge: false },
        Author: { merge: true },
        Channel: { merge: true },
      },
    },
    Comment: {
      keyFields: ["id"],
      fields: {
        CommentAuthor: { merge: false },
        UpvotedByUsers: { merge: false },
        FeedbackComments: { merge: false },
      },
    },
    Event: {
      keyFields: ["id"],
      fields: {
        Tags: { merge: false },
        Channels: { merge: false },
        Poster: { merge: true },
      },
    },
    DiscussionChannel: {
      fields: {
        UpvotedByUsers: { merge: false },
        Channel: { merge: true },
        Comments: { merge: true },
      },
    },
    User: {
      keyFields: ["username"],
    },
    Query: {},
  },
};
