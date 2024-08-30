<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, computed, ref } from "vue";
import type { Discussion, DiscussionChannel } from "@/src/__generated__/graphql";
import { relativeTime } from "@/utils";
import { useRoute } from "vue-router";
import Tag from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import ErrorBanner from "../../ErrorBanner.vue";
import { useDisplay } from "vuetify";
import DiscussionVotes from "../vote/DiscussionVotes.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

export default defineComponent({
  components: {
    ErrorBanner,
    HighlightedSearchTerms,
    Tag,
    DiscussionVotes,
    UsernameWithTooltip,
    MarkdownPreview,
  },
  inheritAttrs: false,
  props: {
    discussionQueryFilters: {
      type: Object as PropType<object>,
      default: () => {
        return {};
      },
    },
    discussionChannel: {
      type: Object as PropType<DiscussionChannel>,
      required: true,
    },
    discussion: {
      type: Object as PropType<Discussion | null>,
      required: false,
      default: null,
    },
    searchInput: {
      type: String,
      default: "",
    },
    selectedTags: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
    selectedChannels: {
      type: Array as PropType<Array<string>>,
      default: () => {
        return [];
      },
    },
  },
  setup(props) {
    const route = useRoute();
    const channelIdInParams = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const discussionIdInParams = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    });
    const defaultUniqueName = computed(() => {
      if (channelIdInParams.value) {
        return channelIdInParams.value;
      }
      return props.discussionChannel.channelUniqueName;
    });

    const { result: localUsernameResult, loading: localUsernameLoading } =
      useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      if (localUsernameLoading.value) {
        return "";
      }
      return localUsernameResult.value?.username || "";
    });

    const discussionChannelId = computed(() => {
      return props.discussionChannel?.id || "";
    });

    const loggedInUserUpvoted = computed(() => {
      if (
        localUsernameLoading.value ||
        !localUsernameResult.value ||
        !discussionChannelId.value
      ) {
        return false;
      }
      const users = props.discussionChannel.UpvotedByUsers || [];

      const loggedInUser = localUsernameResult.value.username;
      const match =
        users.filter((user: any) => {
          return user.username === loggedInUser;
        }).length === 1;
      return match;
    });

    const commentCount = computed(() => {
      if (props.discussionChannel) {
        return props.discussionChannel.CommentsAggregate?.count || 0;
      }
      return 0;
    });

    const { lgAndUp } = useDisplay();

    const truncatedBody = computed(() => {
      if (!props.discussion) {
        return "";
      }

      if (props.discussion?.body && props.discussion.body.length > 200) {
        return props.discussion?.body.slice(0, 250) + "...";
      }
      return props.discussion.body;
    });

    const authorIsAdmin = computed(() => {
      const author = props.discussion?.Author;
      const serverRoles = author?.ServerRoles || [];
      if (serverRoles.length === 0) {
        return false;
      }
      const serverRole = serverRoles[0];
      return serverRole.showAdminTag || false;
    })

    const authorIsMod = computed(() => {
      const author = props.discussion?.Author;
      const channelRoles = author?.ChannelRoles || [];
      if (channelRoles.length === 0) {
        return false;
      }
      const channelRole = channelRoles[0];
      return channelRole.showModTag || false;
    })

    return {
      authorIsAdmin,
      authorIsMod,
      commentCount,
      discussionChannelId,
      defaultUniqueName,
      discussionIdInParams,
      lgAndUp,
      errorMessage: ref(""),
      isActive: computed(
        () =>
          discussionIdInParams.value === props.discussionChannel.discussionId,
      ),
      loggedInUserUpvoted,
      username,
      route,
      timeAgo,
      truncatedBody,
    };
  },
  data(props) {
    return {
      authorDisplayName: props.discussion?.Author
        ? props.discussion.Author.displayName
        : "",
      authorUsername: props.discussion?.Author
        ? props.discussion.Author.username
        : "Deleted",
      authorCommentKarma: props.discussion?.Author
        ? props.discussion.Author.commentKarma
        : 0,
      authorDiscussionKarma: props.discussion?.Author
        ? props.discussion.Author.discussionKarma
        : 0,
      authorAccountCreated: props.discussion?.Author
        ? props.discussion.Author.createdAt
        : "",
      authorProfilePicURL: props.discussion?.Author
        ? props.discussion.Author.profilePicURL
        : "",
      previewIsOpen: false,
      title: props.discussion?.title || "[Deleted]",
      createdAt: props.discussionChannel.createdAt,
      relativeTime: relativeTime(props.discussionChannel.createdAt),
      tags: props.discussion?.Tags
        ? props.discussion.Tags.map((tag) => {
            return tag.text;
          })
        : [],
    };
  },
  computed: {
    detailLink() {
      if (!this.discussion) {
        return "";
      }
      // Base URL for lgAndUp and other screen sizes
      let baseLink = "";

      baseLink = `/channels/c/${this.defaultUniqueName}/discussions/d/${this.discussionChannel.discussionId}`;

      return baseLink;
    },
    filteredQuery() {
      const query = { ...this.$route.query };
      for (const key in query) {
        if (!query[key]) {
          Reflect.deleteProperty(query, key);
        }
      }
      return query;
    },
  },
});
</script>

<template>
  <li
    class="relative my-1 flex md:rounded-lg border dark:border-gray-700 bg-white p-2 dark:bg-gray-800"
  >
    <div class="flex w-full flex-row justify-start gap-4 rounded-lg p-1">
      <div
        v-if="discussion"
        class="w-full flex-col"
      >
        <div class="flex">
          <div
            class="mr-2 flex h-10 w-10 justify-center items-center rounded-md bg-gray-100 p-1 text-xl dark:bg-gray-600"
          >
            💬
          </div>
          <div class="w-full flex-col">
            <router-link
              :to="{ path: detailLink, query: filteredQuery }"
              class="w-full"
            >
              <span
                class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                  :classes="'font-medium text-md'"
                />
              </span>
            </router-link>
            <div
              class="font-medium py-1 text-xs text-gray-600 no-underline dark:text-gray-300"
            >
              <span class="mr-1 text-xs">
                {{ `Posted ${relativeTime} by` }}</span>

              <UsernameWithTooltip
                v-if="authorUsername"
                :is-admin="authorIsAdmin"
                :is-mod="authorIsMod"
                :username="authorUsername"
                :src="authorProfilePicURL ?? ''"
                :display-name="authorDisplayName ?? ''"
                :comment-karma="authorCommentKarma ?? 0"
                :discussion-karma="authorDiscussionKarma ?? 0"
                :account-created="authorAccountCreated"
              />
            </div>
          </div>
        </div>
        <hr class="dark:border-gray-600">

        <div
          v-if="discussion?.body"
          class="my-2 border-gray-400 dark:bg-gray-700"
        >
          <MarkdownPreview
            :text="discussion.body"
            :disable-gallery="false"
            :word-limit="50"
            class="-ml-2"
          />
        </div>
        <div
          class="font-medium my-1 flex space-x-1 text-xs text-gray-600 hover:no-underline"
        >
          <Tag
            v-for="tag in tags"
            :key="tag"
            class="my-1"
            :active="selectedTags.includes(tag)"
            :tag="tag"
            @click="$emit('filterByTag', tag)"
          />
        </div>
        <div class="flex items-center">
          <DiscussionVotes
            v-if="discussionChannel"
            :discussion="discussion"
            :discussion-channel="discussionChannel"
            :show-downvote="false"
          />

          <div class="flex items-center justify-start gap-6">
            <router-link
              :to="{ path: detailLink, query: filteredQuery }"
              class="rounded-md p-1 px-4 underline"
            >
              <i class="fa-regular fa-comment h-5 w-5" />
              <span class="text-md">{{
                `${commentCount} comment${commentCount === 1 ? "" : "s"}`
              }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <ErrorBanner
      v-if="errorMessage"
      :text="errorMessage"
    />
  </li>
</template>
<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
