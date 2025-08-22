<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from "vue";
import type { PropType } from "vue";
import { useRoute } from "nuxt/app";
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from "@/__generated__/graphql";
import { safeArrayFirst } from "@/utils/ssrSafetyUtils";
import TagComponent from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { relativeTime } from "@/utils";
import { useQuery } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import { usernameVar, isAuthenticatedVar } from "@/cache";
// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(() => 
  import("@/components/discussion/detail/DiscussionAlbum.vue")
);

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    default: null,
  },
  score: {
    type: Number,
    default: 0,
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
    default: false,
  },
});

defineEmits(["filterByTag"]);

const route = useRoute();

// Get user preferences for sensitive content
const { result: getUserResult } = useQuery(
  GET_USER,
  () => ({
    username: usernameVar.value || "",
  }),
  () => ({
    enabled: isAuthenticatedVar.value && !!usernameVar.value,
  })
);

const forumId = computed(() => {
  if (!props.discussion) return "";
  const firstChannel = safeArrayFirst(props.discussion.DiscussionChannels);
  return firstChannel?.channelUniqueName || "";
})

// UI state is now handled via props

// Local state for this specific discussion item's expanded/collapsed state
// Initial value is based on the defaultExpanded prop
const isExpanded = ref(props.defaultExpanded);

const commentCount = computed(() => {
  let count = 0;
  if (props.discussion) {
    props.discussion.DiscussionChannels.forEach((dc: DiscussionChannel) => {
      count += dc.CommentsAggregate?.count || 0;
    });
  }
  return count;
});

const submittedToMultipleChannels = computed(
  () => props.discussion?.DiscussionChannels?.length > 1
);

const channelCount = computed(
  () => props.discussion?.DiscussionChannels.length || 0
);

const discussionDetailOptions = computed(() => {
  if (!props.discussion) return [];
  return props.discussion.DiscussionChannels.map((dc) => {
    const commentCount = dc.CommentsAggregate?.count || 0;
    const discussionDetailLink = `/forums/${dc.channelUniqueName}/discussions/${props.discussion?.id}`;
    return {
      label: `${commentCount} ${commentCount === 1 ? "comment" : "comments"} in ${dc.channelUniqueName}`,
      value: discussionDetailLink,
      event: "",
    };
  }).sort((a, b) => b.label.localeCompare(a.label));
});

const authorIsAdmin = computed(() => {
  const serverRoles = props.discussion?.Author?.ServerRoles;
  return serverRoles?.[0]?.showAdminTag || false;
});

const getDetailLink = () => {
  if (!props.discussion) {
    return {
      name: "forums-forumId-discussions",
      params: {
        forumId: forumId.value,
      }
    };
  }
  return {
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: forumId.value,
      discussionId: props.discussion.id
    }
  };
};

const discussionIdInParams = computed(() =>
  typeof route.params.discussionId === "string" ? route.params.discussionId : ""
);
const discussionId = computed(() => props.discussion?.id || "");
const title = computed(() => props.discussion?.title || "[Deleted]");
const tags = computed(
  () => props.discussion?.Tags.map((tag: Tag) => tag.text) || []
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || "Deleted"
);
const relative = computed(() =>
  props.discussion ? relativeTime(props.discussion.createdAt) : ""
);

// Sensitive content logic
const sensitiveContentRevealed = ref(false);
const hasSensitiveContent = computed(() => !!props.discussion?.hasSensitiveContent);
const userAllowsSensitiveContent = computed(() => {
  return getUserResult.value?.users?.[0]?.enableSensitiveContentByDefault || false;
});
const shouldShowContent = computed(() => {
  return !hasSensitiveContent.value || sensitiveContentRevealed.value || userAllowsSensitiveContent.value;
});

const revealSensitiveContent = () => {
  sensitiveContentRevealed.value = true;
};
</script>

<template>
  <li
    class="pt-2 pb-2 px-4 list-none"
    :class="{
      'bg-gray-100 dark:bg-gray-700': discussionIdInParams === discussionId,
    }"
  >
    <div class="flex w-full justify-between">
      <div class="w-full">
        <nuxt-link
          v-if="discussion"
          :to="
            getDetailLink()
          "
          class="-ml-0.5 mb-1 flex items-center gap-2 dark:text-white text-xs"
        >
          <div class="flex items-center text-orange-700 dark:text-white">
            <AvatarComponent
              :text="discussion.DiscussionChannels?.[0]?.channelUniqueName || ''"
              :is-square="true"
              class="mr-1 h-6 w-6"
            />
            <span>{{
              discussion.DiscussionChannels?.[0]?.channelUniqueName || ""
            }}</span>
          </div>
        </nuxt-link>
        <div class="flex gap-2">
          <div class="flex-1">
            <nuxt-link
              v-if="discussion"
              :to="
                getDetailLink()
              "
            >
              <div class="flex items-center gap-2">
                <span
                  :class="
                    discussionIdInParams === discussionId ? 'text-black' : ''
                  "
                  class="cursor-pointer text-sm hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
                >
                  <HighlightedSearchTerms
                    :text="title"
                    :search-input="searchInput"
                  />
                </span>
                <span
                  v-if="hasSensitiveContent"
                  class="text-xs text-orange-600 dark:text-orange-400 border border-orange-600 dark:border-orange-400 rounded-full px-2"
                >
                  Sensitive
                </span>
              </div>
            </nuxt-link>
            <div
              class="text-xs pt-1 text-gray-500 no-underline dark:text-gray-300"
            >
              <!-- Use div instead of p to avoid invalid HTML (button inside p) -->
              <div class="whitespace-normal">
                <!-- Comment count -->
                <nuxt-link
                  v-if="discussion && !submittedToMultipleChannels"
                  :to="getDetailLink()"
                  class="inline"
                >
                  {{ commentCount }} {{ commentCount === 1 ? "comment" : "comments" }}
                </nuxt-link>

                <MenuButton
                  v-else-if="discussion"
                  :items="discussionDetailOptions"
                  class="inline"
                >
                  <span class="inline cursor-pointer">
                    <i class="fa-regular fa-comment mr-1 h-4 w-4" />
                    {{ commentCount }} {{ commentCount === 1 ? "comment" : "comments" }}
                    in {{ channelCount }} {{ channelCount === 1 ? "forum" : "forums" }}
                    <ChevronDownIcon class="inline ml-1 h-4 w-4" aria-hidden="true" />
                  </span>
                </MenuButton>

                <!-- Dot separator and posted info all inline -->
                <span class="mx-1 inline">•</span>
                Posted {{ relative }} by
                <UsernameWithTooltip
                  v-if="authorUsername"
                  :is-admin="authorIsAdmin"
                  :username="authorUsername"
                  :src="discussion?.Author?.profilePicURL || ''"
                  :display-name="discussion?.Author?.displayName || ''"
                  :comment-karma="discussion?.Author?.commentKarma ?? 0"
                  :discussion-karma="discussion?.Author?.discussionKarma ?? 0"
                  :account-created="discussion?.Author?.createdAt"
                />
              </div>
            </div>
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
            <div
              v-if="discussion && (discussion.body || discussion.Album) && isExpanded"
              class="w-full max-w-full overflow-hidden border-l-2 border-gray-300 bg-gray-100 pt-2 my-2 dark:bg-black"
            >
              <!-- Sensitive content concealment box -->
              <div
                v-if="hasSensitiveContent && !sensitiveContentRevealed && !userAllowsSensitiveContent"
                class="rounded border bg-gray-200 dark:bg-gray-800 p-4 text-center ml-2 mr-2 mb-2"
              >
                <p class="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                  This content has been marked as potentially sensitive.
                </p>
                <RequireAuth>
                  <template #has-auth>
                    <button
                      type="button"
                      class="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                      @click="revealSensitiveContent"
                    >
                      Reveal sensitive content
                    </button>
                  </template>
                  <template #does-not-have-auth>
                    <button
                      type="button"
                      class="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
                    >
                      Log in to reveal sensitive content
                    </button>
                  </template>
                </RequireAuth>
              </div>
              
              <!-- Discussion content (hidden when sensitive and not revealed) -->
              <template v-if="shouldShowContent">
                <MarkdownPreview
                  v-if="discussion.body"
                  :text="discussion.body"
                  :word-limit="50"
                  :disable-gallery="false"
                  :image-max-height="'200px'"
                  class="ml-2 pb-2 max-w-full overflow-hidden break-words"
                />
                <div
                  v-if="discussion.Album"
                  class="my-4 max-w-full overflow-x-auto bg-black"
                >
                  <DiscussionAlbum
                    :album="discussion.Album"
                    :carousel-format="true"
                    :discussion-author="authorUsername"
                    :discussion-id="discussion.id"
                    :show-edit-album="false"
                  />
                </div>
              </template>
            </div>
            <div
              class="font-medium mt-1 flex space-x-1 text-sm text-gray-600 hover:no-underline"
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
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
.highlighted {
  background-color: #f9f95d;
}
</style>
