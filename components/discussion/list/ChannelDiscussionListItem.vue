<script lang="ts" setup>
import { ref, computed, defineAsyncComponent } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import TagComponent from '@/components/TagComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import DiscussionVotes from '../vote/DiscussionVotes.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import { stableRelativeTime } from '@/utils';
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from '@/__generated__/graphql';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import { storeToRefs } from 'pinia';
import { useUIStore } from '@/stores/uiStore';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { usernameVar, isAuthenticatedVar } from '@/cache';
// UI state is now handled via props
// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

// Define props
const props = defineProps({
  discussionQueryFilters: {
    type: Object,
    default: () => ({}),
  },
  isSelectable: {
    type: Boolean,
    default: false,
  },
  selectedDiscussionId: {
    type: String,
    default: '',
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
    default: '',
  },
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  defaultExpanded: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['filterByTag', 'filterByChannel', 'select']);

const route = useRoute();
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);

// Get user preferences for sensitive content
const { result: getUserResult } = useQuery(
  GET_USER,
  () => ({
    username: usernameVar.value || '',
  }),
  () => ({
    enabled: isAuthenticatedVar.value && !!usernameVar.value,
  })
);

const channelIdInParams = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
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

const errorMessage = ref('');
// Local state for this specific discussion item's expanded/collapsed state
// Initial value is based on the defaultExpanded prop
const isExpanded = ref(props.defaultExpanded);

const discussionIdInParams = computed(() =>
  typeof route.params.discussionId === 'string' ? route.params.discussionId : ''
);
const discussionId = computed(
  () => props.discussionChannel?.discussionId || props.discussion?.id || ''
);
const isSelected = computed(() => {
  if (props.selectedDiscussionId) {
    return props.selectedDiscussionId === discussionId.value;
  }
  return discussionIdInParams.value === discussionId.value;
});

// Later in the lifecycle, clicking Expand/Collapse on this item only affects this item
// Clicking Expand All/Collapse All will set the default for new items

const authorDisplayName = computed(
  () => props.discussion?.Author?.displayName || ''
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || 'Deleted'
);
const authorCommentKarma = computed(
  () => props.discussion?.Author?.commentKarma || 0
);
const authorDiscussionKarma = computed(
  () => props.discussion?.Author?.discussionKarma || 0
);
const authorAccountCreated = computed(
  () => props.discussion?.Author?.createdAt || ''
);
const authorProfilePicURL = computed(
  () => props.discussion?.Author?.profilePicURL || ''
);
const title = computed(() => props.discussion?.title || '[Deleted]');
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
const hasSensitiveContent = computed(
  () => !!props.discussion?.hasSensitiveContent
);
const userAllowsSensitiveContent = computed(() => {
  return (
    getUserResult.value?.users?.[0]?.enableSensitiveContentByDefault || false
  );
});
const shouldShowContent = computed(() => {
  return (
    !hasSensitiveContent.value ||
    sensitiveContentRevealed.value ||
    userAllowsSensitiveContent.value
  );
});

const revealSensitiveContent = () => {
  sensitiveContentRevealed.value = true;
};

const handleSelect = () => {
  if (!props.isSelectable) return;
  const idToSelect =
    props.discussionChannel?.discussionId || props.discussion?.id || '';
  if (!idToSelect) return;
  emit('select', {
    discussionId: idToSelect,
    title: props.discussion?.title || '',
  });
};
</script>

<template>
  <li
    class="mb-2 flex border-gray-800 pt-2 md:rounded-lg"
    :class="{
      'bg-gray-100 dark:bg-gray-700': isSelected,
    }"
  >
    <div
      class="flex w-full min-w-0 flex-row justify-start gap-4 overflow-hidden rounded-lg"
    >
      <div v-if="discussion" class="w-full min-w-0 flex-col">
        <div class="flex min-w-0 gap-3">
          <div class="w-full min-w-0 flex-col">
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
                class="mb-1 flex w-full items-start gap-2 lg:hidden"
                @click="handleSelect"
              >
                <span
                  class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
                >
                  <HighlightedSearchTerms
                    :text="title"
                    :search-input="searchInput"
                    :classes="[
                      'hover:underline dark:text-gray-100 dark:hover:text-gray-300',
                      fontSize === 'small'
                        ? 'text-sm'
                        : fontSize === 'medium'
                          ? 'text-base'
                          : 'text-lg',
                    ]"
                  />
                </span>
                <span
                  v-if="discussionChannel.archived"
                  class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
                  >Archived</span
                >
                <span
                  v-if="discussionChannel.answered"
                  class="mr-1 flex items-center gap-1 rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-500 dark:border-green-400 dark:text-green-400"
                  aria-label="This discussion has been answered"
                >
                  <CheckCircleIcon class="h-4 w-4" /> Answered
                </span>
                <span
                  v-if="hasSensitiveContent"
                  class="rounded-full border border-orange-600 px-2 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                >
                  Sensitive
                </span>
              </nuxt-link>
              <button
                type="button"
                class="mb-1 hidden w-full items-start gap-2 text-left lg:flex"
                @click="handleSelect"
              >
                <span
                  class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
                >
                  <HighlightedSearchTerms
                    :text="title"
                    :search-input="searchInput"
                    :classes="[
                      'hover:underline dark:text-gray-100 dark:hover:text-gray-300',
                      fontSize === 'small'
                        ? 'text-sm'
                        : fontSize === 'medium'
                          ? 'text-base'
                          : 'text-lg',
                    ]"
                  />
                </span>
                <span
                  v-if="discussionChannel.archived"
                  class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
                  >Archived</span
                >
                <span
                  v-if="discussionChannel.answered"
                  class="mr-1 flex items-center gap-1 rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-500 dark:border-green-400 dark:text-green-400"
                  aria-label="This discussion has been answered"
                >
                  <CheckCircleIcon class="h-4 w-4" /> Answered
                </span>
                <span
                  v-if="hasSensitiveContent"
                  class="rounded-full border border-orange-600 px-2 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                >
                  Sensitive
                </span>
              </button>
              <div
                class="flex items-center gap-2 text-xs font-medium text-gray-600 no-underline dark:text-gray-300"
              >
                <div class="flex items-center">
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
                <AddToDiscussionFavorites
                  v-if="discussion"
                  :allow-add-to-list="true"
                  :discussion-id="discussion.id"
                  :discussion-title="discussion.title"
                  size="small"
                />
              </div>

              <!-- Expand/Collapse button -->
              <div class="mt-1">
                <button
                  v-if="discussion && (discussion.body || discussion.Album)"
                  type="button"
                  class="text-xs text-gray-600 hover:underline dark:text-gray-300"
                  :aria-expanded="isExpanded"
                  @click="isExpanded = !isExpanded"
                >
                  <i
                    v-if="!isExpanded"
                    class="fa-solid fa-expand mr-1 text-xs"
                    aria-hidden="true"
                  />
                  <i
                    v-else
                    class="fa-solid fa-x mr-1 text-xs"
                    aria-hidden="true"
                  />
                  {{ isExpanded ? 'Collapse' : 'Expand' }}
                </button>
              </div>
            </div>

            <!-- Content area when expanded -->
            <div
              v-if="
                discussion &&
                (discussion.body || discussion.Album) &&
                isExpanded
              "
            >
              <!-- Sensitive content concealment box -->
              <div
                v-if="
                  hasSensitiveContent &&
                  !sensitiveContentRevealed &&
                  !userAllowsSensitiveContent
                "
                class="my-2 rounded border bg-gray-200 p-4 text-center dark:bg-gray-800"
              >
                <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
                  This content has been marked as potentially sensitive.
                </p>
                <RequireAuth>
                  <template #has-auth>
                    <button
                      type="button"
                      class="rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800"
                      @click="revealSensitiveContent"
                    >
                      Reveal sensitive content
                    </button>
                  </template>
                  <template #does-not-have-auth>
                    <button
                      type="button"
                      class="rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800"
                    >
                      Log in to reveal sensitive content
                    </button>
                  </template>
                </RequireAuth>
              </div>

              <!-- Discussion content (hidden when sensitive and not revealed) -->
              <template v-if="shouldShowContent">
                <div
                  v-if="discussion.body"
                  class="my-2 border-l bg-gray-100 py-2 pl-4 pr-2 dark:border-gray-600 dark:bg-black"
                >
                  <MarkdownPreview
                    :text="discussion.body"
                    :disable-gallery="false"
                    :word-limit="50"
                    :image-max-height="'150px'"
                  />
                </div>
                <div
                  v-if="discussion.Album && discussion.Album?.Images.length > 0"
                  class="relative z-30 my-4 max-w-full overflow-x-auto bg-black"
                >
                  <DiscussionAlbum
                    :album="discussion.Album"
                    :discussion-id="discussion.id"
                    :discussion-author="authorUsername"
                    :carousel-format="true"
                    :show-edit-album="false"
                    :show-thumbnails="false"
                  />
                </div>
              </template>
            </div>
            <div
              class="my-1 flex space-x-1 text-xs font-medium text-gray-600 hover:no-underline"
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
            <div class="flex items-center gap-2 dark:text-white">
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
                  class="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <i class="fa-regular fa-comment text-xs" aria-hidden="true" />
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
