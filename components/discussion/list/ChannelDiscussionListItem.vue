<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from "vue";
import type { PropType } from "vue";
import { useRoute } from "nuxt/app";
import TagComponent from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import DiscussionVotes from "../vote/DiscussionVotes.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { stableRelativeTime } from "@/utils";
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from "@/__generated__/graphql";
import CheckCircleIcon from "@/components/icons/CheckCircleIcon.vue";
import { storeToRefs } from "pinia";
import { useUIStore } from "@/stores/uiStore";
// UI state is now handled via props
// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(() => 
  import("@/components/discussion/detail/DiscussionAlbum.vue")
);

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
  defaultExpanded: {
    type: Boolean,
    default: true,
  },
});

defineEmits(["filterByTag"]);

const route = useRoute();
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);

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
// Local state for this specific discussion item's expanded/collapsed state
// Initial value is based on the defaultExpanded prop
const isExpanded = ref(props.defaultExpanded);

// Later in the lifecycle, clicking Expand/Collapse on this item only affects this item
// Clicking Expand All/Collapse All will set the default for new items

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
  stableRelativeTime(props.discussionChannel.createdAt)
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

// Sensitive content logic
const sensitiveContentRevealed = ref(false);
const hasSensitiveContent = computed(() => !!props.discussion?.hasSensitiveContent);
const shouldShowContent = computed(() => {
  return !hasSensitiveContent.value || sensitiveContentRevealed.value;
});

const revealSensitiveContent = () => {
  sensitiveContentRevealed.value = true;
};
</script>

<template>
  <li class="mb-2 pt-2 flex md:rounded-lg border-gray-800">
    <div
      class="flex w-full flex-row justify-start gap-4 rounded-lg overflow-hidden"
    >
      <div v-if="discussion" class="w-full flex-col">
        <div class="flex gap-3">
          <div class="w-full flex-col">
            <div>
              <nuxt-link
                :to="{
                  name: 'forums-forumId-discussions-discussionId',
                  params: {
                    forumId: defaultUniqueName,
                    discussionId: discussionChannel.discussionId,
                  },
                  query: filteredQuery,
                }"
                class="w-full flex items-center gap-2 mb-1"
              >
                <span
                  class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
                >
                  <HighlightedSearchTerms
                    :text="title"
                    :search-input="searchInput"
                    :classes="[
                      'hover:underline dark:text-gray-100 dark:hover:text-gray-300',
                      fontSize === 'small' ? 'text-sm' : fontSize === 'medium' ? 'text-base' : 'text-lg'
                    ]"
                  />
                </span>
                <span
                  v-if="discussionChannel.archived"
                  class="text-xs text-red-500 dark:text-red-400 border border-red-500 dark:border-red-400 rounded-full px-2"
                  >Archived</span
                >
                <span
                  v-if="discussionChannel.answered"
                  class="text-green-500 dark:text-green-400 mr-1 border dark:border-green-400 border-green-500 rounded-full text-xs flex gap-1 items-center py-0.5 px-2"
                  aria-label="This discussion has been answered"
                > 
                  <CheckCircleIcon class="h-4 w-4" /> Answered
                </span>
                <span
                  v-if="hasSensitiveContent"
                  class="text-xs text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-full px-2"
                >
                  Sensitive
                </span>
              </nuxt-link>
              <div
                class="font-medium text-xs text-gray-600 no-underline dark:text-gray-300"
              >
                <span class="mr-1 text-xs text-gray-500 dark:text-gray-300">{{
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
              
              <!-- Expand/Collapse buttons -->
              <div class="mt-1">
                <button
                  v-if="discussion && (discussion.body || discussion.Album) && !isExpanded"
                  class="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                  @click="isExpanded = true"
                >
                  <i
                    class="mr-1 fa-solid fa-expand text-md text-gray-600 dark:text-gray-300 hover:underline"
                  />
                  Expand
                </button>
                <button
                  v-if="discussion && (discussion.body || discussion.Album) && isExpanded"
                  class="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                  @click="isExpanded = false"
                >
                  <i
                    class="mr-1 fa-solid fa-x text-xs text-gray-600 dark:text-gray-300 hover:underline"
                  />
                  Collapse
                </button>
              </div>
            </div>

            <!-- Content area when expanded -->
            <div v-if="discussion && (discussion.body || discussion.Album) && isExpanded">
              <!-- Sensitive content concealment box -->
              <div
                v-if="hasSensitiveContent && !sensitiveContentRevealed"
                class="rounded border bg-gray-200 dark:bg-gray-800 p-4 text-center my-2"
              >
                <p class="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                  This content has been marked as potentially sensitive.
                </p>
                <button
                  type="button"
                  class="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                  @click="revealSensitiveContent"
                >
                  Reveal sensitive content
                </button>
              </div>
              
              <!-- Discussion content (hidden when sensitive and not revealed) -->
              <template v-if="shouldShowContent">
                <div
                  v-if="discussion.body"
                  class="my-2 dark:bg-black bg-gray-100 px-2 border-l pt-2 pb-4 dark:border-gray-600"
                >
                  <MarkdownPreview
                    :text="discussion.body"
                    :disable-gallery="false"
                    :word-limit="50" 
                    :image-max-height="'150px'"
                    class="ml-2"
                  />
                </div>
                <div v-if="discussion.Album && discussion.Album?.Images.length > 0" class="my-4 overflow-x-auto bg-black">
                  <DiscussionAlbum
                    :album="discussion.Album"
                    :discussion-id="discussion.id"
                    :discussion-author="authorUsername"
                    :carousel-format="true"
                    :show-edit-album="false"
                  />
                </div>
              </template>
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
            <div class="flex items-center dark:text-white gap-2">
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
                  class="py-0.5 rounded-full dark:bg-gray-700 bg-gray-100 px-2 flex items-center gap-2 dark:hover:bg-gray-600"
                >
                  <i class="fa-regular fa-comment text-xs" />
                  <span class="text-sm">{{ commentCount }}</span>
                </nuxt-link>
              </div>
            </div>
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
