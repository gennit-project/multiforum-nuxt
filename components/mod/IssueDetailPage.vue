<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useQuery , useMutation } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import {
  GET_CLOSED_ISSUES_BY_CHANNEL,
  GET_ISSUE,
  GET_ISSUES_BY_CHANNEL,
} from "@/graphQLData/issue/queries";
import { CLOSE_ISSUE, REOPEN_ISSUE ,
  ADD_ISSUE_ACTIVITY_FEED_ITEM,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT,
} from "@/graphQLData/issue/mutations";
import type { Issue } from "@/__generated__/graphql";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { useDisplay } from "vuetify";
import "md-editor-v3/lib/style.css";
import BackLink from "@/components/BackLink.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import { DateTime } from "luxon";
import DiscussionDetails from "@/components/mod/DiscussionDetails.vue";
import EventDetail from "@/components/event/detail/EventDetail.vue";
import CommentDetails from "@/components/mod/CommentDetails.vue";
import ModerationWizard from "@/components/mod/ModerationWizard.vue";
import IssueBadge from "@/components/mod/IssueBadge.vue";
import TextEditor from "../TextEditor.vue";
import GenericButton from "../GenericButton.vue";
import SaveButton from "../SaveButton.vue";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import ActivityFeed from "@/components/mod/ActivityFeed.vue";
import {
  COUNT_CLOSED_ISSUES,
  COUNT_OPEN_ISSUES,
} from "@/graphQLData/mod/queries";

export default defineComponent({
  components: {
    ActivityFeed,
    BackLink,
    CommentDetails,
    ErrorBanner,
    EventDetail,
    DiscussionDetails,
    GenericButton,
    IssueBadge,
    ModerationWizard,
    PageNotFound,
    SaveButton,
    TextEditor,
  },
  props: {
    compactMode: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const offset = ref(0);

    const channelId = computed(() => {
      if (typeof route.params.forumId === "string") {
        return route.params.forumId;
      }
      return "";
    });

    const issueId = computed(() => {
      if (typeof route.params.issueId === "string") {
        return route.params.issueId;
      }
      return "";
    });

    const {
      result: getIssueResult,
      error: getIssueError,
      loading: getIssueLoading,
    } = useQuery(GET_ISSUE, { id: issueId });

    const activeIssue = computed<Issue>(() => {
      if (
        getIssueLoading.value ||
        getIssueError.value ||
        !getIssueResult.value
      ) {
        return null;
      }
      return getIssueResult.value.issues[0];
    });

    const activeIssueId = computed(() => {
      if (activeIssue.value) {
        return activeIssue.value.id;
      }
      return "";
    });

    const { mutate: closeIssue } = useMutation(CLOSE_ISSUE, () => ({
      variables: {
        id: activeIssueId.value,
      },
      update(cache) {
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
          const existingIssuesByChannel =
            existingIssuesByChannelData.channels[0];
          const newIssuesByChannel = {
            ...existingIssuesByChannel,
            Issues: existingIssuesByChannel.Issues.filter(
              (issue: Issue) => issue.id !== activeIssueId.value,
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
        const existingClosedIssuesByChannelData = cache.readQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
        });

        if (
          existingClosedIssuesByChannelData &&
          // @ts-ignore
          existingClosedIssuesByChannelData.channels
        ) {
          // @ts-ignore
          const existingClosedIssuesByChannel =
            existingClosedIssuesByChannelData.channels[0];
          const newClosedIssuesByChannel = {
            ...existingClosedIssuesByChannel,
            Issues: [
              ...existingClosedIssuesByChannel.Issues,
              activeIssue.value,
            ],
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

    const {
      mutate: addIssueActivityFeedItem,
      error: addIssueActivityFeedItemError,
      loading: addIssueActivityFeedItemLoading,
    } = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM, {
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
            issue.id === updatedIssue.id ? updatedIssue : issue,
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

    const { mutate: reopenIssue } = useMutation(REOPEN_ISSUE, () => ({
      variables: {
        id: activeIssueId.value,
      },
      update(cache) {
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
        const existingClosedIssuesByChannelData = cache.readQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
        });

        if (
          existingClosedIssuesByChannelData &&
          // @ts-ignore
          existingClosedIssuesByChannelData.channels
        ) {
          // @ts-ignore
          const existingClosedIssuesByChannel =
            existingClosedIssuesByChannelData.channels[0];
          const newClosedIssuesByChannel = {
            ...existingClosedIssuesByChannel,
            Issues: existingClosedIssuesByChannel.Issues.filter(
              (issue: Issue) => issue.id !== activeIssueId.value,
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
          const existingIssuesByChannel =
            existingIssuesByChannelData.channels[0];
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

    const createCommentDefaultValues: CreateEditCommentFormValues = {
      text: "",
      isRootComment: true,
      depth: 1,
    };

    const createFormValues = ref<CreateEditCommentFormValues>(
      createCommentDefaultValues,
    );

    const {
      mutate: createComment,
      loading: createCommentLoading,
      error: createCommentError,
    } = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT, {
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
            issue.id === updatedIssue.id ? updatedIssue : issue,
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

     
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const issue = computed<Issue>(() => {
      if (getIssueLoading.value || getIssueError.value) {
        return null;
      }
      return getIssueResult.value.issues[0];
    });

    const { lgAndUp, mdAndUp, smAndDown } = useDisplay();

    const previousOffset = ref(0);

    const closeOpenButtonText = computed(() => {
      if (activeIssue.value && activeIssue.value.isOpen) {
        if (createFormValues.value.text.length > 0) {
          return "Close with comment";
        }
        return "Close issue";
      }
      if (createFormValues.value.text.length > 0) {
        return "Reopen with comment";
      }
      return "Reopen issue";
    });

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value?.modProfileName || "";
    });

    return {
      activeIssue,
      addIssueActivityFeedItem,
      addIssueActivityFeedItemError,
      addIssueActivityFeedItemLoading,
      channelId,
      closeIssue,
      closeOpenButtonText,
      createComment,
      createCommentError,
      createCommentLoading,
      createFormValues,
      getIssueResult,
      getIssueError,
      getIssueLoading,
      issue,
      lgAndUp,
      loggedInUserModName,
      mdAndUp,
      offset,
      previousOffset,
      reopenIssue,
      relativeTime,
      route,
      router,
      smAndDown,
      username,
    };
  },
  methods: {
    formatDate(date: string) {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
    },
    updateComment(text: string) {
      this.createFormValues.text = text;
    },
    async handleCreateComment() {
      if (!this.activeIssue || !this.activeIssue.id) {
        console.warn(
          "Could not create the comment because there is no active issue",
        );
        return;
      }
      if (!this.loggedInUserModName) {
        console.warn(
          "Could not create the comment because there is no logged in moderator",
        );
        return;
      }
      this.createComment({
        issueId: this.activeIssue.id,
        commentText: this.createFormValues.text,
        displayName: this.loggedInUserModName,
        actionDescription: "commented on the issue",
        actionType: "comment",
      });
      // Reset the form values
      this.createFormValues.text = "";
    },
    toggleCloseOpenIssue() {
      if (!this.activeIssue || !this.activeIssue.id) {
        console.warn(
          "Could not close or reopen the issue because there is no active issue",
        );
        return;
      }
      if (!this.loggedInUserModName) {
        console.warn(
          "Could not close or reopen the issue because there is no logged in moderator",
        );
        return;
      }
      if (this.createFormValues.text.length > 0) {
        this.createComment({
          issueId: this.activeIssue.id,
          commentText: this.createFormValues.text,
          displayName: this.loggedInUserModName,
          actionDescription: "commented on the issue",
          actionType: "comment",
        });
        // Reset the form values
        this.createFormValues.text = "";
      }
      if (this.activeIssue.isOpen) {
        this.closeIssue();
        this.addIssueActivityFeedItem({
          issueId: this.activeIssue.id,
          displayName: this.loggedInUserModName,
          actionDescription: "closed the issue",
          actionType: "close",
        });
      } else {
        this.reopenIssue();
        this.addIssueActivityFeedItem({
          issueId: this.activeIssue.id,
          displayName: this.loggedInUserModName,
          actionDescription: "reopened the issue",
          actionType: "reopen",
        });
      }
    },
  },
});
</script>

<template>
  <PageNotFound v-if="!getIssueLoading && !getIssueLoading && !activeIssue" />
  <div
    v-else
    class="w-full max-w-7xl space-y-2 rounded-lg bg-white py-2 dark:bg-gray-800 sm:px-2 md:px-4 lg:px-6"
  >
    <div
      v-if="route.name === 'IssueDetail'"
      class="align-center mx-1 mt-2 flex justify-between px-4"
    >
      <BackLink
        :link="`/forums/f/${channelId}/issues`"
        :data-testid="'issue-detail-back-link'"
      />
    </div>

    <ErrorBanner
      v-if="getIssueError"
      class="mt-2 px-4"
      :text="getIssueError.message"
    />
    <div
      v-else-if="!getIssueLoading"
      class="mt-2 flex flex-col gap-2 px-4"
    >
      <h1 class="text-wrap text-2xl font-bold sm:tracking-tight">
        {{ issue && issue.title ? issue.title : "[Deleted]" }}
      </h1>
      <div class="flex items-center gap-2">
        <IssueBadge
          :key="issue.isOpen"
          :issue="issue"
        />
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{
            `First reported on ${formatDate(issue.createdAt)} by ${
              issue.Author?.displayName || "[Deleted]"
            }`
          }}
        </div>
      </div>

      <p v-if="activeIssue?.relatedDiscussionId || activeIssue?.relatedEventId">
        Original post (
        <router-link
          v-if="activeIssue?.relatedDiscussionId"
          class="text-blue-500 hover:underline"
          :to="{
            name: 'DiscussionDetail',
            params: {
              discussionId: activeIssue.relatedDiscussionId,
              forumId: channelId,
            },
          }"
        >
          link
        </router-link>
        <router-link
          v-else-if="activeIssue?.relatedEventId"
          class="text-blue-500 hover:underline"
          :to="{
            name: 'EventDetail',
            params: {
              eventId: activeIssue.relatedEventId,
              forumId: channelId,
            },
          }"
        >
          link
        </router-link>
        <span>):</span>
      </p>
      <p
        v-if="activeIssue?.relatedCommentId"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        Original comment:
      </p>
      <DiscussionDetails
        v-if="activeIssue && activeIssue.relatedDiscussionId"
        :active-issue="activeIssue"
      />
      <EventDetail
        v-if="activeIssue && activeIssue.relatedEventId"
        :issue-event-id="activeIssue.relatedEventId"
        :show-comments="false"
        :show-menu-buttons="false"
      />
      <CommentDetails
        v-if="activeIssue && activeIssue.relatedCommentId"
        :comment-id="activeIssue.relatedCommentId"
      />
    </div>
    <v-row
      v-if="issue"
      class="flex justify-center"
    >
      <v-col>
        <div class="space-y-3 px-4">
          <h2
            v-if="activeIssue"
            class="text-xl font-bold"
          >
            Activity Feed
          </h2>

          <ActivityFeed
            v-if="activeIssue"
            :key="activeIssue.id"
            :feed-items="activeIssue.ActivityFeed || []"
          />

          <ModerationWizard
            v-if="activeIssue && activeIssue.isOpen"
            :issue="issue"
          />

          <div class="flex w-full flex-col">
            <h2
              v-if="activeIssue"
              class="text-xl font-bold border-b mb-4 pb-1"
            >
              Leave a comment
            </h2>
            <TextEditor
              :key="`${createFormValues.text === ''}`"
              :test-id="'texteditor-textarea'"
              :placeholder="'Please be kind'"
              :initial-value="createFormValues.text"
              @update="updateComment"
            />
            <div class="mt-3 flex justify-end">
              <GenericButton
                :text="closeOpenButtonText"
                @click="toggleCloseOpenIssue"
              />
              <SaveButton
                data-testid="createCommentButton"
                :label="'Comment'"
                :disabled="createFormValues.text.length === 0"
                :loading="createCommentLoading && !createCommentError"
                @click.prevent="handleCreateComment"
              />
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>
