<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useRoute } from "vue-router";
import TagComponent from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import DiscussionVotes from "../vote/DiscussionVotes.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { relativeTime } from "@/utils";
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from "@/__generated__/graphql";

// Define props
const props = defineProps({
  discussionQueryFilters: {
    type: Object,
    default: () => ({}),
  },
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: true,
  },
  discussion: {
    type: Object as PropType<Discussion>,
    default: null,
  },
  searchInput: {
    type: String,
    default: "",
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  selectedChannels: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["filterByTag"]);

const route = useRoute();

const channelIdInParams = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const defaultUniqueName = computed(
  () => channelIdInParams.value || props.discussionChannel.channelUniqueName
);
const commentCount = computed(
  () => props.discussionChannel?.CommentsAggregate?.count || 0
);

const authorIsAdmin = computed(() => {
  const author = props.discussion?.Author;
  return author?.ServerRoles?.[0]?.showAdminTag || false;
});

const authorIsMod = computed(() => {
  const author = props.discussion?.Author;
  return author?.ChannelRoles?.[0]?.showModTag || false;
});

const errorMessage = ref("");

const authorDisplayName = computed(
  () => props.discussion?.Author?.displayName || ""
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || "Deleted"
);
const authorCommentKarma = computed(
  () => props.discussion?.Author?.commentKarma || 0
);
const authorDiscussionKarma = computed(
  () => props.discussion?.Author?.discussionKarma || 0
);
const authorAccountCreated = computed(
  () => props.discussion?.Author?.createdAt || ""
);
const authorProfilePicURL = computed(
  () => props.discussion?.Author?.profilePicURL || ""
);
const title = computed(() => props.discussion?.title || "[Deleted]");
const relativeTimeAgo = computed(() =>
  relativeTime(props.discussionChannel.createdAt)
);
const tags = computed(
  () => props.discussion?.Tags?.map((tag: Tag) => tag.text) || []
);

const filteredQuery = computed(() => {
  const query = { ...route.query };
  for (const key in query) {
    if (!query[key]) Reflect.deleteProperty(query, key);
  }
  return query;
});
</script>

<template>
  <li
    class="relative my-1 flex md:rounded-lg border border-gray-800 bg-white p-2 dark:bg-gray-800"
  >
    <div class="flex w-full flex-row justify-start gap-4 rounded-lg p-1">
      <div v-if="discussion" class="w-full flex-col">
        <div class="flex">
          <div
            class="mr-2 flex h-10 w-10 justify-center items-center rounded-md bg-gray-100 p-1 text-xl dark:bg-gray-600"
          >
            💬
          </div>
          <div class="w-full flex-col">
            <nuxt-link
              :to="{
                name: 'forums-forumId-discussions-discussionId',
                params: {
                  forumId: defaultUniqueName,
                  discussionId: discussionChannel.discussionId,
                },
                query: filteredQuery,
              }"
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
            </nuxt-link>
            <div
              class="font-medium py-1 text-xs text-gray-600 no-underline dark:text-gray-300"
            >
              <span class="mr-1 text-xs">{{
                `Posted ${relativeTimeAgo} by`
              }}</span>
              <UsernameWithTooltip
                v-if="authorUsername"
                :is-admin="authorIsAdmin"
                :is-mod="authorIsMod"
                :username="authorUsername"
                :src="authorProfilePicURL ?? ''"
                :display-name="authorDisplayName ?? ''"
                :comment-karma="authorCommentKarma"
                :discussion-karma="authorDiscussionKarma"
                :account-created="authorAccountCreated"
              />
            </div>
          </div>
        </div>
        <hr class="dark:border-gray-600" >
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
          <TagComponent
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
            <nuxt-link
              :to="{
                name: 'forums-forumId-discussions-discussionId',
                params: {
                  forumId: defaultUniqueName,
                  discussionId: discussionChannel.discussionId,
                },
                query: filteredQuery,
              }"
              class="rounded-md p-1 px-4 underline"
            >
              <i class="fa-regular fa-comment h-5 w-5" />
              <span class="text-md">{{
                `${commentCount} comment${commentCount === 1 ? "" : "s"}`
              }}</span>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
    <ErrorBanner v-if="errorMessage" :text="errorMessage" />
  </li>
</template>

<style scoped>
.highlighted {
  background-color: #f9f95d;
}
</style>
