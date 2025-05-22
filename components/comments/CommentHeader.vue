<script setup lang="ts">
  import { computed } from "vue";
  import type { PropType } from "vue";
  import type { Comment } from "@/__generated__/graphql";
  import { relativeTime } from "@/utils";
  import { getCommentAuthorStatus } from "@/utils/headerPermissionUtils";
  import {
    getPermalinkToDiscussionComment,
    getPermalinkToDiscussion,
    getPermalinkToEventComment,
    getPermalinkToEvent,
  } from "@/utils/routerUtils";

  // Props definition using defineProps
  const props = defineProps({
    commentData: {
      type: Object as PropType<Comment>,
      required: true,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    parentCommentId: {
      type: String,
      default: "",
    },
    showContextLink: {
      type: Boolean,
      default: true,
    },
    showChannel: {
      type: Boolean,
      default: false,
    },
    originalPoster: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
    },
  });
  // Use the utility function to determine admin/mod status
  const authorStatus = computed(() => {
    return getCommentAuthorStatus({
      author: props.commentData.CommentAuthor,
    });
  });

  const isAdmin = computed(() => authorStatus.value.isAdmin);
  const isMod = computed(() => authorStatus.value.isMod);

  const commentAuthorUsername = computed(() => props.commentData.CommentAuthor?.username);
  const commentAuthorProfilePic = computed(() => props.commentData.CommentAuthor?.profilePicURL);
  const commentAuthorDisplayName = computed(() => props.commentData.CommentAuthor?.displayName);

  const createdAtFormatted = computed(() => {
    if (!props.commentData.createdAt) {
      return "";
    }
    return `posted ${relativeTime(props.commentData.createdAt)}${
      props.showChannel
        ? " in c/" +
          (props.commentData.DiscussionChannel?.channelUniqueName ||
            (props.commentData.Event?.EventChannels &&
              props.commentData.Event?.EventChannels[0].channelUniqueName) ||
            props.commentData.Channel?.uniqueName ||
            "")
        : ""
    }`;
  });

  const editedAtFormatted = computed(() => {
    if (!props.commentData.updatedAt) {
      return "";
    }
    return `Edited ${relativeTime(props.commentData.updatedAt)}`;
  });

  const contextLinkObject = computed(() => {
    const {
      Channel,
      GivesFeedbackOnComment,
      GivesFeedbackOnDiscussion,
      GivesFeedbackOnEvent,
      DiscussionChannel,
      Event,
      ParentComment,
    } = props.commentData;
    if (!Channel?.uniqueName && !DiscussionChannel?.channelUniqueName) {
      console.error("Could not get context link because the channel unique name was not found");
      return "";
    }
    if (GivesFeedbackOnComment) {
      if (GivesFeedbackOnComment.DiscussionChannel) {
        // If it's giving feedback on a discussion comment, the context is the
        // discussion comment it's giving feedback on.
        return getPermalinkToDiscussionComment({
          forumId: Channel?.uniqueName || "",
          discussionId: GivesFeedbackOnComment.DiscussionChannel?.discussionId || "",
          commentId: GivesFeedbackOnComment.id,
        });
      }
      // If it's giving feedback on an event comment, the context is the
      // event comment it's giving feedback on.
      return getPermalinkToEventComment({
        forumId: Channel?.uniqueName || "",
        eventId: GivesFeedbackOnComment.Event?.id || "",
        commentId: GivesFeedbackOnComment.id,
      });
    }
    if (GivesFeedbackOnDiscussion) {
      // If it's giving feedback on a discussion, the context is the discussion.
      return getPermalinkToDiscussion({
        forumId: Channel?.uniqueName || "",
        discussionId: GivesFeedbackOnDiscussion.id,
      });
    }
    if (GivesFeedbackOnEvent) {
      // If it's giving feedback on an event, the context is the event.
      return getPermalinkToEvent({
        forumId: GivesFeedbackOnEvent.EventChannels[0]?.channelUniqueName || "",
        eventId: GivesFeedbackOnEvent.id,
      });
    }
    // If the discussion comment has a parent comment, the context is the parent comment.
    if (ParentComment && DiscussionChannel) {
      return getPermalinkToDiscussionComment({
        forumId: DiscussionChannel?.channelUniqueName || "",
        discussionId: DiscussionChannel?.discussionId || "",
        commentId: ParentComment.id,
      });
    }
    if (ParentComment && Event) {
      // If the event comment has a parent comment, the context is the parent comment.
      return getPermalinkToEventComment({
        forumId: Event.EventChannels[0]?.channelUniqueName || "",
        eventId: Event.id,
        commentId: ParentComment.id,
      });
    }
    // By default, return a permalink to the comment itself. The link is different
    // whether it's a comment on a discussion or an event.
    if (DiscussionChannel) {
      return getPermalinkToDiscussionComment({
        forumId: DiscussionChannel?.channelUniqueName || "",
        discussionId: DiscussionChannel?.discussionId || "",
        commentId: props.commentData.id,
      });
    }
    return getPermalinkToEventComment({
      forumId: Event?.EventChannels[0]?.channelUniqueName || "",
      eventId: Event?.id || "",
      commentId: props.commentData.id,
    });
  });
</script>

<template>
  <div class="flex w-full">
    <p v-if="!commentData">[Deleted]</p>
    <AvatarComponent
      v-else-if="commentAuthorUsername"
      class="z-10"
      :is-small="true"
      :src="commentAuthorProfilePic || ''"
      :text="commentAuthorUsername"
    />
    <AvatarComponent
      v-else-if="commentData.CommentAuthor?.displayName"
      class="z-10"
      :is-small="true"
      :text="commentData.CommentAuthor.displayName"
    />

    <div
      class="flex-grow border-gray-300 pl-4 dark:border-gray-600"
      :class="!commentAuthorUsername ? '-ml-5' : '-ml-4 border-l'"
    >
      <div v-if="showContextLink && parentCommentId && commentData.DiscussionChannel">
        <NuxtLink
          class="px-2 text-xs underline"
          :to="contextLinkObject"
        >
          View Context
        </NuxtLink>
      </div>
      <div class="mt-2 flex flex-wrap items-center">
        <div class="ml-1 flex flex-wrap items-center space-x-2 text-xs dark:text-gray-300">
          <NuxtLink
            v-if="commentAuthorUsername"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentAuthorUsername },
            }"
          >
            <span class="flex flex-row items-center gap-1">
              <span
                v-if="!commentAuthorDisplayName"
                class="font-bold"
                >{{ commentAuthorUsername }}</span
              >
              <span
                v-if="commentAuthorDisplayName"
                class="font-bold"
                >{{ commentAuthorDisplayName }}</span
              >
              <span
                v-if="commentAuthorDisplayName"
                class="text-gray-500 dark:text-gray-300"
                >{{ `(u/${commentAuthorUsername})` }}</span
              >

              <span
                v-if="isAdmin"
                class="rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
                >Admin</span
              >
              <span
                v-else-if="isMod"
                class="rounded-md border border-orange-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
                >Mod</span
              >
              <span
                v-if="commentAuthorUsername === originalPoster"
                class="rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
                >OP</span
              >
            </span>
          </NuxtLink>
          <NuxtLink
            v-else-if="commentData.CommentAuthor?.displayName"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentData.CommentAuthor.displayName },
            }"
          >
            {{ commentData.CommentAuthor.displayName }}
          </NuxtLink>
          <span
            v-else
            class="flex items-center font-bold"
          >
            <div class="mr-2 h-8 w-8 rounded-full border dark:border-gray-300" />
            [Deleted]
          </span>
          <span class="mx-2">&middot;</span>
          <span>{{ createdAtFormatted }}</span>
          <span
            v-if="commentData.updatedAt"
            class="mx-2"
            >&middot;</span
          >
          <span>{{ editedAtFormatted }}</span>
          <span
            v-if="isHighlighted"
            class="rounded-lg bg-orange-500 px-2 py-1 text-black"
          >
            Permalinked
          </span>
          <span
            v-if="label"
            class="rounded-lg border border-orange-500 bg-orange-100 px-2 py-1 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
          >
            {{ label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
