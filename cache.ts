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
      merge: true,
      keyFields: ["text"],
    },
    Channel: {
      keyFields: ["uniqueName"],
      merge: true,
      fields: {
        Tags: { merge: true },
        Admins: { merge: true },
      },
    },
    Discussion: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: { merge: true },
        DiscussionChannels: { merge: true },
        Author: { merge: true },
        Channel: { merge: true },
      },
    },
    Comment: {
      keyFields: ["id"],
      merge: true,
      fields: {
        CommentAuthor: { merge: true },
        UpvotedByUsers: { merge: true },
        FeedbackComments: { merge: true },
      },
    },
    Event: {
      keyFields: ["id"],
      merge: true,
      fields: {
        Tags: { merge: true },
        Channels: { merge: true },
        Poster: { merge: true },
      },
    },
    DiscussionChannel: {
      keyFields: ["discussionId", "channelUniqueName"],
      merge: true,
      fields: {
        UpvotedByUsers: { merge: true },
        Channel: { merge: true },
        Comments: { merge: true },
        CommentsAggregate: {
          // Treat CommentsAggregate as a non-normalized object
          merge(existing, incoming) {
            return incoming; // Always overwrite with the new aggregate count
          },
        },
      },
    },
    User: {
      keyFields: ["username"],
      merge: true,
      fields: {
        Discussions: { merge: true },
        Comments: { merge: true },
        Events: { merge: true },
        UpvotedComments: { merge: true },
        UpvotedDiscussions: { merge: true },
        UpvotedEvents: { merge: true },
        SubscribedChannels: { merge: true },
        SubscribedTags: { merge: true },
        ModProfiles: { merge: true },
        ChannelRoles: {
          merge(existing = [], incoming = []) {
            // Merge existing roles with incoming roles
            return incoming.length ? incoming : existing;
          },
        },
      },
    },
    ChannelRole: {
      keyFields: ["channelUniqueName"],
      merge: true,
    },
    Query: {},
  },
};
