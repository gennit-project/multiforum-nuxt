<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, computed } from "vue";
import type { Comment, User, ModerationProfile } from "@/__generated__/graphql";
import UsernameWithTooltip from "../UsernameWithTooltip.vue";
// @ts-ignore
import clickOutside from "vue-click-outside";
import { relativeTime } from "@/utils";

export default defineComponent({
  components: {
    UsernameWithTooltip,
  },
  directives: {
    clickOutside,
  },
  props: {
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
  },
  setup(props) {
    const isAdmin = computed(() => {
      const author: User | ModerationProfile | undefined | null =
        props.commentData.CommentAuthor;
      if (!author) {
        return false;
      }
      if (author.__typename === "User") {
        const serverRoles = author.ServerRoles;
        if (!serverRoles) {
          return false;
        }
        if (serverRoles.length === 0) {
          return false;
        }
        const serverRole = serverRoles[0];
        if (serverRole.showAdminTag) {
          return true;
        }
      }

      return false;
    });

    const isMod = computed(() => {
      const author: User | ModerationProfile | undefined | null =
        props.commentData.CommentAuthor;
      if (!author) {
        return false;
      }
      if (author.__typename === "User") {
        const channelRoles = author.ChannelRoles;
        if (!channelRoles) {
          return false;
        }
        if (channelRoles.length === 0) {
          return false;
        }
        const channelRole = channelRoles[0];
        if (channelRole.showModTag) {
          return true;
        }
        return false;
      }
      return false;
    });
    return {
      isAdmin,
      isMod,
      relativeTime,
    };
  },
  computed: {
    commentAuthorUsername() {
      return this.commentData.CommentAuthor?.username;
    },
    commentAuthorProfilePic() {
      return this.commentData.CommentAuthor?.profilePicURL;
    },
    commentAuthorDisplayName() {
      return this.commentData.CommentAuthor?.displayName;
    },
    commentKarma() {
      return this.commentData.CommentAuthor?.commentKarma ?? 0;
    },
    discussionKarma() {
      return this.commentData.CommentAuthor?.discussionKarma ?? 0;
    },
    createdAt() {
      return this.commentData.createdAt;
    },
    createdAtFormatted() {
      if (!this.commentData.createdAt) {
        return "";
      }
      return `posted ${this.relativeTime(this.commentData.createdAt)}${
        this.showChannel
          ? " in c/" +
            (this.commentData.DiscussionChannel?.channelUniqueName ||
              this.commentData.Event?.EventChannels[0]?.channelUniqueName ||
              "")
          : ""
      }`;
    },
    editedAtFormatted() {
      if (!this.commentData.updatedAt) {
        return "";
      }
      return `Edited ${this.relativeTime(this.commentData.updatedAt)}`;
    },
  },
});
</script>

<template>
  <div class="flex w-full">
    <p v-if="!commentData">[Deleted]</p>
    <AvatarComponent
      v-else-if="commentAuthorUsername"
      class="z-10"
      :is-small="true"
      :text="commentAuthorUsername"
      :src="commentAuthorProfilePic || ''"
    />
    <AvatarComponent
      v-else-if="commentData.CommentAuthor?.displayName"
      class="z-10"
      :is-small="true"
      :text="commentData.CommentAuthor.displayName"
    />

    <div
      :class="!commentAuthorUsername ? '-ml-5' : '-ml-4 border-l '"
      class="flex-grow border-gray-300 pl-4 dark:border-gray-600"
    >
      <div
        v-if="
          showContextLink && parentCommentId && commentData.DiscussionChannel
        "
      >
        <nuxt-link
          class="px-2 text-xs underline"
          :to="{
            name: 'forums-forumId-discussions-discussionId-comments-commentId',
            params: {
              discussionId: commentData.DiscussionChannel.discussionId,
              commentId: parentCommentId,
              forumId: commentData.DiscussionChannel.channelUniqueName,
            },
          }"
        >
          View Context
        </nuxt-link>
      </div>
      <div class="mt-2 flex flex-wrap items-center">
        <div
          class="ml-1 flex flex-wrap items-center space-x-2 text-xs dark:text-gray-300"
        >
          <nuxt-link
            v-if="commentAuthorUsername"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentAuthorUsername },
            }"
          >
            <UsernameWithTooltip
              v-if="commentAuthorUsername"
              :username="commentAuthorUsername"
              :src="commentAuthorProfilePic || ''"
              :display-name="commentAuthorDisplayName || ''"
              :comment-karma="commentKarma ?? 0"
              :discussion-karma="discussionKarma ?? 0"
              :account-created="createdAt"
              :is-admin="isAdmin"
              :is-mod="isMod"
              :is-original-poster="commentAuthorUsername === originalPoster"
            />
          </nuxt-link>
          <nuxt-link
            v-else-if="commentData.CommentAuthor?.displayName"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentData.CommentAuthor.displayName },
            }"
          >
            {{ commentData.CommentAuthor.displayName }}
          </nuxt-link>
          <span v-else class="flex items-center font-bold">
            <div
              class="mr-2 h-8 w-8 rounded-full border dark:border-gray-500"
            />
            [Deleted]
          </span>
          <span class="mx-2">&middot;</span>
          <span>{{ createdAtFormatted }}</span>
          <span v-if="commentData.updatedAt" class="mx-2"> &middot; </span>
          <span>{{ editedAtFormatted }}</span>
          <span
            v-if="isHighlighted"
            class="rounded-lg bg-blue-500 px-2 py-1 text-black"
            >Permalinked
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
