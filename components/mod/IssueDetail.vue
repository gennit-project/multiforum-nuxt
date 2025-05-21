<script lang="ts" setup>
  import { ref, computed } from "vue";
  import { useQuery, useMutation } from "@vue/apollo-composable";
  import {
    GET_CLOSED_ISSUES_BY_CHANNEL,
    GET_ISSUE,
    GET_ISSUES_BY_CHANNEL,
  } from "@/graphQLData/issue/queries";
  import {
    CLOSE_ISSUE,
    REOPEN_ISSUE,
    ADD_ISSUE_ACTIVITY_FEED_ITEM,
    ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
    ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER,
  } from "@/graphQLData/issue/mutations";
  import { COUNT_CLOSED_ISSUES, COUNT_OPEN_ISSUES } from "@/graphQLData/mod/queries";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { DateTime } from "luxon";
  import type { Issue } from "@/__generated__/graphql";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import "md-editor-v3/lib/style.css";
  import PageNotFound from "@/components/PageNotFound.vue";
  import DiscussionDetails from "@/components/mod/DiscussionDetails.vue";
  import EventDetail from "@/components/event/detail/EventDetail.vue";
  import CommentDetails from "@/components/mod/CommentDetails.vue";
  import ModerationWizard from "@/components/mod/ModerationWizard.vue";
  import ActivityFeed from "@/components/mod/ActivityFeed.vue";
  import { modProfileNameVar, usernameVar } from "@/cache";
  import { useRoute } from "nuxt/app";
  import XCircleIcon from "../icons/XCircleIcon.vue";
  import ArrowPathIcon from "../icons/ArrowPath.vue";

  // Setup
  const route = useRoute();

  // Route and issueId computations
  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const issueId = computed(() => {
    return typeof route.params.issueId === "string" ? route.params.issueId : "";
  });

  // Fetch issue data
  const {
    result: getIssueResult,
    error: getIssueError,
    loading: getIssueLoading,
    refetch: refetchIssue,
  } = useQuery(GET_ISSUE, { id: issueId.value });

  // Setup a query to get channel data (we'll use this for refetching after actions)
  const { refetch: refetchChannel } = useQuery(
    GET_CHANNEL,
    {
      uniqueName: channelId,
      now: DateTime.local().startOf("hour").toISO(),
    },
    {
      fetchPolicy: "network-only", // Always fetch from network when refetching
      skip: true, // Skip initial execution, we'll only use for refetch
    }
  );

  const activeIssue = computed<Issue | null>(() => {
    if (getIssueError.value || !getIssueResult.value) return null;
    return getIssueResult.value.issues[0];
  });

  const activeIssueId = computed(() => activeIssue.value?.id || "");

  const { mutate: closeIssue, loading: closeIssueLoading } = useMutation(CLOSE_ISSUE, () => ({
    variables: {
      id: activeIssueId.value,
    },
    update(cache) {
      // Get the issue in the cache by ID, then edit it so the isOpen field is false.
      cache.modify({
        id: cache.identify({
          __typename: "Issue",
          id: activeIssueId.value,
        }),
        fields: {
          isOpen() {
            return false;
          },
        },
      });

      // update the result of COUNT_CLOSED_ISSUES
      // to increment the count of closed issues
      const existingClosedIssuesData = cache.readQuery({
        query: COUNT_CLOSED_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesData &&
        // @ts-ignore
        existingClosedIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
        const newClosedIssues = {
          count: existingClosedIssues.count + 1,
        };

        cache.writeQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newClosedIssues,
          },
        });
      }

      // Also update the result of COUNT_OPEN_ISSUES
      // to decrement the count of open issues
      const existingOpenIssuesData = cache.readQuery({
        query: COUNT_OPEN_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingOpenIssuesData &&
        // @ts-ignore
        existingOpenIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
        const newOpenIssues = {
          count: existingOpenIssues.count - 1,
        };

        cache.writeQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newOpenIssues,
          },
        });
      }

      // Also update the result of GET_ISSUES_BY_CHANNEL
      // to remove this issue from the list of open issues
      const existingIssuesByChannelData = cache.readQuery({
        query: GET_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingIssuesByChannelData &&
        // @ts-ignore
        existingIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingIssuesByChannel = existingIssuesByChannelData.channels[0];
        const newIssuesByChannel = {
          ...existingIssuesByChannel,
          Issues: existingIssuesByChannel.Issues.filter(
            (issue: Issue) => issue.id !== activeIssueId.value
          ),
        };

        cache.writeQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newIssuesByChannel],
          },
        });
      }

      // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
      // to add this issue to the list of closed issues
      const existingClosedIssuesByChannelData: any = cache.readQuery({
        query: GET_CLOSED_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesByChannelData &&
        // @ts-ignore
        existingClosedIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingClosedIssuesByChannel = existingClosedIssuesByChannelData.channels[0];
        const newClosedIssuesByChannel = {
          ...existingClosedIssuesByChannel,
          Issues: [...existingClosedIssuesByChannel.Issues, activeIssue.value],
        };

        cache.writeQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newClosedIssuesByChannel],
          },
        });
      }
    },
  }));

  const { mutate: reopenIssue, loading: reopenIssueLoading } = useMutation(REOPEN_ISSUE, () => ({
    variables: {
      id: activeIssueId.value,
    },
    update(cache) {
      // Get the issue in the cache by ID, then edit it so the isOpen field is true.
      cache.modify({
        id: cache.identify({
          __typename: "Issue",
          id: activeIssueId.value,
        }),
        fields: {
          isOpen() {
            return true;
          },
        },
      });
      // update the result of COUNT_CLOSED_ISSUES
      // to decrement the count of closed issues
      const existingClosedIssuesData = cache.readQuery({
        query: COUNT_CLOSED_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesData &&
        // @ts-ignore
        existingClosedIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
        const newClosedIssues = {
          count: existingClosedIssues.count - 1,
        };

        cache.writeQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newClosedIssues,
          },
        });
      }

      // Also update the result of COUNT_OPEN_ISSUES
      // to increment the count of open issues
      const existingOpenIssuesData = cache.readQuery({
        query: COUNT_OPEN_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingOpenIssuesData &&
        // @ts-ignore
        existingOpenIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
        const newOpenIssues = {
          count: existingOpenIssues.count + 1,
        };

        cache.writeQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newOpenIssues,
          },
        });
      }

      // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
      // so that the newly reopened issue is removed from the list
      // of closed issues.
      const existingClosedIssuesByChannelData: any = cache.readQuery({
        query: GET_CLOSED_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesByChannelData &&
        // @ts-ignore
        existingClosedIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingClosedIssuesByChannel = existingClosedIssuesByChannelData.channels[0];
        const newClosedIssuesByChannel = {
          ...existingClosedIssuesByChannel,
          Issues: existingClosedIssuesByChannel.Issues.filter(
            (issue: Issue) => issue.id !== activeIssueId.value
          ),
        };

        cache.writeQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newClosedIssuesByChannel],
          },
        });
      }

      // Also update the result of GET_ISSUES_BY_CHANNEL
      // to add this issue to the list of open issues
      const existingIssuesByChannelData = cache.readQuery({
        query: GET_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingIssuesByChannelData &&
        // @ts-ignore
        existingIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingIssuesByChannel = existingIssuesByChannelData.channels[0];
        const newIssuesByChannel = {
          ...existingIssuesByChannel,
          Issues: [...existingIssuesByChannel.Issues, activeIssue.value],
        };

        cache.writeQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newIssuesByChannel],
          },
        });
      }
    },
  }));

  const { mutate: addIssueActivityFeedItem } = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM, {
    update: (cache, { data: { updateIssues } }) => {
      const { issues } = updateIssues;
      const updatedIssue: Issue = issues[0];

      // Attempt to read the existing issues from the cache
      const existingIssueData = cache.readQuery({
        query: GET_ISSUE,
        variables: { id: updatedIssue.id },
      });

      if (
        existingIssueData &&
        // @ts-ignore
        existingIssueData.issues &&
        // @ts-ignore
        existingIssueData.issues.length > 0
      ) {
        // @ts-ignore
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
          variables: { id: updatedIssue.id },
          data: {
            issues: newIssues,
          },
        });
      }
    },
  });

  const {
    mutate: addIssueActivityFeedItemWithCommentAsMod,
    loading: addIssueActivityFeedItemWithCommentAsModLoading,
    error: addIssueActivityFeedItemWithCommentAsModError,
  } = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD, {
    update: (cache, { data: { updateIssues } }) => {
      const { issues } = updateIssues;
      const updatedIssue: Issue = issues[0];

      // Attempt to read the existing issues from the cache
      const existingIssueData = cache.readQuery({
        query: GET_ISSUE,
        variables: { id: updatedIssue.id },
      });

      if (
        existingIssueData &&
        // @ts-ignore
        existingIssueData.issues &&
        // @ts-ignore
        existingIssueData.issues.length > 0
      ) {
        // @ts-ignore
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
          variables: { id: updatedIssue.id },
          data: {
            issues: newIssues,
          },
        });
      }
    },
  });

  const {
    mutate: addIssueActivityFeedItemWithCommentAsUser,
    loading: addIssueActivityFeedItemWithCommentAsUserLoading,
    error: addIssueActivityFeedItemWithCommentAsUserError,
  } = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER, {
    update: (cache, { data: { updateIssues } }) => {
      const { issues } = updateIssues;
      const updatedIssue: Issue = issues[0];

      // Attempt to read the existing issues from the cache
      const existingIssueData = cache.readQuery({
        query: GET_ISSUE,
        variables: { id: updatedIssue.id },
      });

      if (
        existingIssueData &&
        // @ts-ignore
        existingIssueData.issues &&
        // @ts-ignore
        existingIssueData.issues.length > 0
      ) {
        // @ts-ignore
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
          variables: { id: updatedIssue.id },
          data: {
            issues: newIssues,
          },
        });
      }
    },
  });

  const closeOpenButtonText = computed(() => {
    if (activeIssue.value?.isOpen)
      return createFormValues.value.text ? "Close with comment" : "Close issue";
    return createFormValues.value.text ? "Reopen with comment" : "Reopen issue";
  });

  // Form values for creating comments
  const createCommentDefaultValues = { text: "", isRootComment: true, depth: 1 };
  const createFormValues = ref(createCommentDefaultValues);

  const issue = computed<Issue | null>(() => getIssueResult.value?.issues[0] || null);

  // Get the username of the original author of the reported content
  const originalAuthorUsername = ref("");

  // Get the mod profile name of the original author, if applicable
  const originalModProfileName = ref("");

  // Determine if the current user is the original author via username
  const isOriginalUserAuthor = computed(() => {
    return !!usernameVar.value && originalAuthorUsername.value === usernameVar.value;
  });

  // Determine if the current user is the original author via mod profile
  const isOriginalModAuthor = computed(() => {
    return !!modProfileNameVar.value && originalModProfileName.value === modProfileNameVar.value;
  });

  const updateComment = (text: string) => {
    createFormValues.value.text = text;
  };

  const handleCreateComment = async () => {
    if (!activeIssue.value) return;

    // Case 1: Current user is the original author who posted as a regular user
    if (isOriginalUserAuthor.value) {
      await addIssueActivityFeedItemWithCommentAsUser({
        issueId: activeIssue.value.id,
        commentText: createFormValues.value.text,
        username: usernameVar.value,
        actionDescription: "commented on the issue",
        actionType: "comment",
        channelUniqueName: channelId.value,
      });
    }
    // Case 2: Current user is the original author who posted as a mod OR current user is not the original author
    else if (isOriginalModAuthor.value) {
      if (!modProfileNameVar.value) return;
      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        commentText: createFormValues.value.text,
        displayName: modProfileNameVar.value,
        actionDescription: "commented on the issue",
        actionType: "comment",
        channelUniqueName: channelId.value,
      });
    }

    createFormValues.value.text = "";
  };

  const toggleCloseOpenIssue = async () => {
    if (!activeIssue.value || !modProfileNameVar.value) return;

    try {
      if (activeIssue.value.isOpen) {
        // Close the issue
        await closeIssue();

        if (createFormValues.value.text) {
          await addIssueActivityFeedItemWithCommentAsMod({
            issueId: activeIssue.value.id,
            displayName: modProfileNameVar.value,
            actionDescription: "closed the issue",
            actionType: "close",
            commentText: createFormValues.value.text,
            channelUniqueName: channelId.value,
          });
        } else {
          await addIssueActivityFeedItem({
            issueId: activeIssue.value.id,
            displayName: modProfileNameVar.value,
            actionDescription: "closed the issue",
            actionType: "close",
          });
        }
      } else {
        // Reopen the issue
        await reopenIssue();

        if (createFormValues.value.text) {
          await addIssueActivityFeedItemWithCommentAsMod({
            issueId: activeIssue.value.id,
            displayName: modProfileNameVar.value,
            actionDescription: "reopened the issue",
            actionType: "reopen",
            commentText: createFormValues.value.text,
            channelUniqueName: channelId.value,
          });
        } else {
          await addIssueActivityFeedItem({
            issueId: activeIssue.value.id,
            displayName: modProfileNameVar.value,
            actionDescription: "reopened the issue",
            actionType: "reopen",
          });
        }
      }

      // Refetch channel data to update issue counts in the UI
      // This is important for updating the IssuesAggregate count in ChannelTabs
      try {
        await refetchChannel();
        console.log("Refetched channel data to update issue counts");
      } catch (error) {
        console.error("Error refetching channel data:", error);
      }

      // Reset comment form
      createFormValues.value.text = "";
    } catch (error) {
      console.error("Error toggling issue open/close state:", error);
    }
  };
</script>

<template>
  <PageNotFound v-if="!getIssueLoading && !activeIssue" />
  <div
    v-else
    class="w-full max-w-screen-2xl space-y-2 rounded-lg bg-white py-2 dark:bg-gray-800 dark:text-white sm:px-2 md:px-4 lg:px-6"
  >
    <ErrorBanner
      v-if="getIssueError"
      class="mt-2 px-4"
      :text="getIssueError.message"
    />
    <div
      v-else-if="activeIssue"
      class="mt-2 flex flex-col gap-2 px-4"
    >
      <h2
        v-if="
          activeIssue?.relatedDiscussionId ||
          activeIssue?.relatedEventId ||
          activeIssue?.relatedCommentId
        "
        class="text-xl font-bold"
      >
        {{
          `Original ${
            activeIssue?.relatedDiscussionId
              ? "discussion"
              : activeIssue?.relatedEventId
                ? "event"
                : "comment"
          }`
        }}
      </h2>
      <div
        id="original-post-container"
        class="rounded-lg border border-black px-4 py-2 dark:border-gray-600"
      >
        <DiscussionDetails
          v-if="activeIssue?.relatedDiscussionId"
          :active-issue="activeIssue"
          @fetched-original-author-username="originalAuthorUsername = $event"
        />
        <EventDetail
          v-if="activeIssue?.relatedEventId"
          :issue-event-id="activeIssue.relatedEventId"
          :show-add-to-calendar="false"
          :show-comments="false"
          :show-event-in-past-banner="false"
          :show-menu-buttons="false"
          :show-title="true"
          :username-on-top="true"
          @fetched-original-author-username="originalAuthorUsername = $event"
        />
        <CommentDetails
          v-if="activeIssue?.relatedCommentId"
          :comment-id="activeIssue.relatedCommentId"
          @fetched-original-author-username="originalAuthorUsername = $event"
          @fetched-original-mod-profile-name="originalModProfileName = $event"
        />
      </div>
    </div>

    <v-row
      v-if="issue"
      class="flex justify-center dark:text-white"
    >
      <v-col>
        <div class="px-4">
          <h2
            v-if="activeIssue"
            class="text-xl font-bold"
          >
            Activity Feed
          </h2>

          <ActivityFeed
            v-if="activeIssue"
            :key="activeIssue.id"
            class="mb-6"
            :feed-items="activeIssue.ActivityFeed || []"
            :original-mod-author-name="originalModProfileName"
            :original-user-author-username="originalAuthorUsername"
          />

          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsModError"
            :text="addIssueActivityFeedItemWithCommentAsModError.message"
          />
          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsUserError"
            :text="addIssueActivityFeedItemWithCommentAsUserError.message"
          />
          <ModerationWizard
            v-if="
              issue &&
              (activeIssue?.relatedDiscussionId ||
                activeIssue?.relatedEventId ||
                activeIssue?.relatedCommentId)
            "
            :channel-unique-name="channelId"
            :close-issue-loading="closeIssueLoading"
            :comment-id="activeIssue?.relatedCommentId || ''"
            :discussion-id="activeIssue?.relatedDiscussionId || ''"
            :event-id="activeIssue?.relatedEventId || ''"
            :issue="issue"
            @archived-successfully="refetchIssue"
            @close-issue="toggleCloseOpenIssue"
            @open-issue="toggleCloseOpenIssue"
            @suspended-mod-successfully="refetchIssue"
            @suspended-user-successfully="refetchIssue"
            @unarchived-successfully="refetchIssue"
            @unsuspended-mod-successfully="refetchIssue"
            @unsuspended-user-successfully="refetchIssue"
          />
          <div class="flex w-full flex-col">
            <h2
              v-if="activeIssue"
              class="mt-8 border-b pb-1 text-xl font-bold"
            >
              Leave a comment
            </h2>
            <TextEditor
              :key="`${createFormValues.text === ''}`"
              :disable-auto-focus="false"
              :initial-value="createFormValues.text"
              :placeholder="'Please be kind'"
              :test-id="'texteditor-textarea'"
              @update="updateComment"
            />
            <div class="mt-3 flex justify-end">
              <GenericButton
                :loading="closeIssueLoading || reopenIssueLoading"
                :test-id="'close-open-issue-button'"
                :text="closeOpenButtonText"
                @click="toggleCloseOpenIssue"
              >
                <XCircleIcon v-if="issue.isOpen" />
                <ArrowPathIcon v-else />
              </GenericButton>
              <SaveButton
                :data-testid="'createCommentButton'"
                :disabled="createFormValues.text.length === 0"
                :label="'Comment'"
                :loading="
                  addIssueActivityFeedItemWithCommentAsModLoading ||
                  addIssueActivityFeedItemWithCommentAsUserLoading
                "
                @click.prevent="handleCreateComment"
              />
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
