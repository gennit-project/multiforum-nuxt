<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import TagComponent from '@/components/TagComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import DiscussionVotes from '../vote/DiscussionVotes.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import { relativeTime } from '@/utils';
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from '@/__generated__/graphql';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import ImageIcon from '@/components/icons/ImageIcon.vue';
import { storeToRefs } from 'pinia';
import { useUIStore } from '@/stores/uiStore';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';

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
    default: '',
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

defineEmits(['filterByTag', 'openAlbum']);

const route = useRoute();
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);

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
  relativeTime(props.discussionChannel.createdAt)
);
const tags = computed(
  () => props.discussion?.Tags?.map((tag: Tag) => tag.text) || []
);

// Get the first image from the album if available, respecting imageOrder
const firstAlbumImage = computed(() => {
  const album = props.discussion?.Album;
  if (!album?.Images?.length) return null;

  // If imageOrder exists and has items, use the first ordered image
  if (album.imageOrder?.length && album.imageOrder.length > 0) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find((img) => img.id === firstImageId);
    return orderedImage?.url || null;
  }

  // Fallback to first image in the Images array
  return album.Images[0]?.url || null;
});

const filteredQuery = computed(() => {
  const query = { ...route.query };
  for (const key in query) {
    if (!query[key]) Reflect.deleteProperty(query, key);
  }
  return query;
});
</script>

<template>
  <li class="mb-2 flex border-gray-300 pt-2 dark:bg-gray-800 md:rounded-lg">
    <div
      class="flex w-full flex-row justify-start gap-4 overflow-hidden rounded-lg"
    >
      <div v-if="discussion" class="w-full flex-col">
        <div class="relative mb-1">
          <nuxt-link
            class="flex w-full items-center gap-2"
            :to="{
              name: 'forums-forumId-downloads-discussionId',
              params: {
                forumId: defaultUniqueName,
                discussionId: discussionChannel.discussionId,
              },
              query: filteredQuery,
            }"
          >
            <div
              class="aspect-square w-full overflow-hidden border bg-gray-100 dark:bg-gray-700"
            >
              <img
                v-if="firstAlbumImage"
                :src="firstAlbumImage"
                :alt="title"
                class="h-full w-full object-cover"
              >
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400"
              >
                No image available
              </div>
            </div>
          </nuxt-link>

          <!-- Top right buttons container -->
          <div class="absolute right-2 top-2 z-10 flex gap-2">
            <!-- Add to Favorites Button -->
            <div
              v-if="discussion"
              class="rounded-md bg-black bg-opacity-50 p-1.5 transition-all duration-200 hover:bg-opacity-70"
              @click.stop
            >
              <AddToDiscussionFavorites
                :allow-add-to-list="true"
                :discussion-id="discussion.id"
                :discussion-title="discussion.title"
                :initial-is-favorited="(discussionChannel as any).isFavorited"
                entity-name="Download"
                size="small"
              />
            </div>

            <!-- Album View Button -->
            <button
              v-if="
                discussion?.Album?.Images?.length &&
                discussion.Album.Images.length > 0
              "
              type="button"
              class="rounded-md bg-black bg-opacity-50 p-2 text-white transition-all duration-200 hover:bg-opacity-70"
              title="View album"
              aria-label="View album"
              @click.stop="
                $emit('openAlbum', { discussion, album: discussion?.Album })
              "
            >
              <ImageIcon class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="flex gap-3">
          <div class="w-full flex-col">
            <div>
              <nuxt-link
                class="mb-1 flex w-full items-center gap-2"
                :to="{
                  name: 'forums-forumId-downloads-discussionId',
                  params: {
                    forumId: defaultUniqueName,
                    discussionId: discussionChannel.discussionId,
                  },
                  query: filteredQuery,
                }"
              >
                <span
                  class="cursor-pointer hover:text-gray-500 dark:text-gray-100"
                >
                  <HighlightedSearchTerms
                    :classes="[
                      'hover:underline dark:text-gray-100 dark:hover:text-gray-300',
                      fontSize === 'small'
                        ? 'text-sm'
                        : fontSize === 'medium'
                          ? 'text-base'
                          : 'text-lg',
                    ]"
                    :search-input="searchInput"
                    :text="title"
                  />
                </span>
                <span
                  v-if="discussionChannel.archived"
                  class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
                  >Archived</span
                >
                <span
                  v-if="discussionChannel.answered"
                  aria-label="This discussion has been answered"
                  class="mr-1 flex items-center gap-1 rounded-full border border-green-500 px-2 py-0.5 text-xs text-green-500 dark:border-green-400 dark:text-green-400"
                >
                  <CheckCircleIcon class="h-4 w-4" /> Answered
                </span>
              </nuxt-link>
              <div
                class="text-xs font-medium text-gray-600 no-underline dark:text-gray-300"
              >
                <span class="mr-1 text-xs text-gray-500 dark:text-gray-300">{{
                  `Posted ${relativeTimeAgo} by`
                }}</span>
                <UsernameWithTooltip
                  v-if="authorUsername"
                  :account-created="authorAccountCreated"
                  :comment-karma="authorCommentKarma"
                  :discussion-karma="authorDiscussionKarma"
                  :display-name="authorDisplayName ?? ''"
                  :is-admin="authorIsAdmin"
                  :is-mod="authorIsMod"
                  :src="authorProfilePicURL ?? ''"
                  :username="authorUsername"
                />
              </div>
            </div>
            <div
              class="my-1 flex space-x-1 text-xs font-medium text-gray-600 hover:no-underline"
            >
              <TagComponent
                v-for="tag in tags"
                :key="tag"
                :active="selectedTags.includes(tag)"
                class="my-1"
                :tag="tag"
                @click="$emit('filterByTag', tag)"
              />
            </div>
            <div
              class="flex items-center justify-between gap-2 dark:text-white"
            >
              <!-- <div class="text-gray-900 dark:text-white"><sup>$</sup>0.<sup>00</sup></div> -->
              <div class="flex items-center gap-1">
                <DiscussionVotes
                  v-if="discussionChannel"
                  :discussion="discussion"
                  :discussion-channel="discussionChannel"
                  :show-downvote="false"
                  :use-heart-icon="true"
                />

                <nuxt-link
                  class="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-700 dark:hover:bg-gray-600"
                  :to="{
                    name: 'forums-forumId-downloads-discussionId',
                    params: {
                      forumId: defaultUniqueName,
                      discussionId: discussionChannel.discussionId,
                    },
                    query: filteredQuery,
                  }"
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

<style scoped>
.highlighted {
  background-color: #f9f95d;
}
</style>
