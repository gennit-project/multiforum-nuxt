<script lang="ts" setup>
import { computed } from "vue";
import type { PropType } from "vue";
import { useRoute } from "vue-router";
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from "@/__generated__/graphql";
import TagComponent from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";

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
  showBodyByDefault: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["filterByTag"]);

const route = useRoute();

const showBody = ref(props.showBodyByDefault);

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

const getDetailLink = (channelId: string) => {
  if (!props.discussion) {
    return "";
  }
  return `/forums/${channelId}/discussions/${props.discussion.id}`;
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
</script>

<template>
  <li
    class="pt-2 px-4 list-none"
    :class="{
      'bg-gray-100 dark:bg-gray-700': discussionIdInParams === discussionId,
    }"
  >
    <div class="flex w-full justify-between">
      <div class="w-full">
        <div class="flex">
          <div
            class="mr-2 flex items-center justify-center flex-start w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-600"
          >
            💬
          </div>
          <div>
            <nuxt-link
              v-if="discussion"
              :to="
                getDetailLink(
                  discussion.DiscussionChannels[0].channelUniqueName
                )
              "
            >
              <span
                :class="
                  discussionIdInParams === discussionId ? 'text-black' : ''
                "
                class="cursor-pointer text-base hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                  :classes="'font-medium'"
                />
              </span>
            </nuxt-link>
            <div
              class="font-sm flex flex-wrap items-center gap-1 text-sm text-gray-500 no-underline dark:text-gray-300"
            >
              <span>
                {{ `Posted ${relative} by ` }}
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
              </span>
            </div>
            <button
              v-if="discussion && discussion.body && !showBody"
              class="text-md text-gray-600 dark:text-gray-300 hover:underline"
              @click="showBody = true"
            >
              <i
                class="mr-1 fa-solid fa-expand text-md text-gray-600 dark:text-gray-300 hover:underline"
                @click="showBody = true"
              />
              Expand
            </button>
            <button
              v-if="discussion && discussion.body && showBody"
              class="text-xs text-gray-600 dark:text-gray-300 hover:underline"
              @click="showBody = false"
            >
              <i
                class="mr-1 fa-solid fa-x text-xs text-gray-600 dark:text-gray-300 hover:underline"
                @click="showBody = false"
              />
              Collapse
            </button>
          </div>
        </div>

        <div class="ml-6 flex-col gap-1">
          <div
            v-if="discussion && discussion.body && showBody"
            class="w-full border-l-2 border-gray-300 bg-gray-100 rounded"
          >
            <MarkdownPreview
              :text="discussion.body"
              :word-limit="50"
              :disable-gallery="false"
              class="-ml-2"
            />
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
          <nuxt-link
            v-if="discussion && !submittedToMultipleChannels"
            :to="
              getDetailLink(discussion.DiscussionChannels[0].channelUniqueName)
            "
            class="flex items-center gap-2 px-4 pb-2 pt-2 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            <span>{{
              `${commentCount} ${
                commentCount === 1 ? "comment" : "comments"
              } in `
            }}</span>

            <div
              class="mr-2 flex items-center rounded-full bg-blue-100 pr-2 text-blue-700 dark:bg-gray-600 dark:text-white"
            >
              <AvatarComponent
                :text="discussion.DiscussionChannels[0].channelUniqueName || ''"
                class="mr-1 h-8 w-8"
              />
              <span>{{
                discussion.DiscussionChannels[0].channelUniqueName || ""
              }}</span>
            </div>
          </nuxt-link>

          <MenuButton v-else-if="discussion" :items="discussionDetailOptions">
            <button
              class="-ml-1 flex items-center rounded-md bg-gray-100 px-4 pb-2 pt-2 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500"
            >
              <i class="fa-regular fa-comment mr-2 h-4 w-4" />
              {{
                `${commentCount} ${
                  commentCount === 1 ? "comment" : "comments"
                } in ${channelCount} ${channelCount === 1 ? "forum" : "forums"}`
              }}
              <ChevronDownIcon class="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
            </button>
          </MenuButton>
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
