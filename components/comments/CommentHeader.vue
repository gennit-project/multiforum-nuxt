<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, computed } from "vue";
import type { Comment } from "@/__generated__/graphql";
import UsernameWithTooltip from "../UsernameWithTooltip.vue";
import clickOutside from "vue-click-outside";
import { relativeTime } from "@/utils";

export default defineComponent({
  name: "EmojiPicker",
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
      const serverRoles = props.commentData.CommentAuthor?.ServerRoles;
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
      return false;
    });

    const isMod = computed(() => {
      const channelRoles = props.commentData.CommentAuthor?.ChannelRoles;
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
    });
    return {
      isAdmin,
      isMod,
      relativeTime,
    };
  },
  computed: {
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
    <p v-if="!commentData">
      [Deleted]
    </p>
    <Avatar
      v-else-if="commentData.CommentAuthor?.username"
      class="z-10"
      :is-small="true"
      :text="commentData.CommentAuthor.username"
      :src="commentData.CommentAuthor.profilePicURL || ''"
    />
    <Avatar
      v-else-if="commentData.CommentAuthor?.displayName"
      class="z-10"
      :is-small="true"
      :text="commentData.CommentAuthor.displayName"
    />

    <div
      :class="
        !commentData.CommentAuthor?.username ? '-ml-5' : '-ml-4 border-l '
      "
      class="flex-grow border-gray-300 pl-4 dark:border-gray-600"
    >
      <div
        v-if="
          showContextLink && parentCommentId && commentData.DiscussionChannel
        "
      >
        <router-link
          class="px-2 text-xs underline"
          :to="{
            name: 'DiscussionCommentPermalink',
            params: {
              discussionId: commentData.DiscussionChannel.discussionId,
              commentId: parentCommentId,
              channelId: commentData.DiscussionChannel.channelUniqueName,
            },
          }"
        >
          View Context
        </router-link>
      </div>
      <div class="mt-2 flex flex-wrap items-center">
        <div
          class="ml-1 flex flex-wrap items-center space-x-2 text-xs dark:text-gray-300"
        >
          <router-link
            v-if="commentData.CommentAuthor?.username"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="`/u/${commentData.CommentAuthor.username}`"
          >
            <UsernameWithTooltip
              v-if="commentData.CommentAuthor.username"
              :username="commentData.CommentAuthor.username"
              :src="commentData.CommentAuthor.profilePicURL"
              :display-name="commentData.CommentAuthor.displayName || ''"
              :comment-karma="commentData.CommentAuthor.commentKarma ?? 0"
              :discussion-karma="commentData.CommentAuthor.discussionKarma ?? 0"
              :account-created="commentData.CommentAuthor.createdAt"
              :is-admin="isAdmin"
              :is-mod="isMod"
              :is-original-poster="
                commentData.CommentAuthor.username === originalPoster
              "
            />
          </router-link>
          <router-link
            v-else-if="commentData.CommentAuthor?.displayName"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="`/u/${commentData.CommentAuthor.displayName}`"
          >
            {{ commentData.CommentAuthor.displayName }}
          </router-link>
          <span
            v-else
            class="flex items-center font-bold"
          >
            <div
              class="mr-2 h-8 w-8 rounded-full border dark:border-gray-500"
            />
            [Deleted]
          </span>
          <span class="mx-2">&middot;</span>
          <span>{{ createdAtFormatted }}</span>
          <span
            v-if="commentData.updatedAt"
            class="mx-2"
          > &middot; </span>
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
