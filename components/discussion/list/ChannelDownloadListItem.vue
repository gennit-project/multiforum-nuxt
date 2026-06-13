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
import type { DiscussionChannelWithFavorited } from '@/types/Discussion';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import ImageIcon from '@/components/icons/ImageIcon.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

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

const channelIdInParams = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const defaultUniqueName = computed(
  () => channelIdInParams.value || props.discussionChannel.channelUniqueName
);
const { serverAdminUsernames } = useServerRoleMembership();
const commentCount = computed(
  () => props.discussionChannel?.CommentsAggregate?.count || 0
);

const authorIsAdmin = computed(() => {
  return (
    getServerRoleBadge({
      username: props.discussion?.Author?.username,
      adminUsernames: serverAdminUsernames.value,
    }) === 'serverAdmin'
  );
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
  <li class="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div class="flex w-full flex-col">
      <div v-if="discussion" class="w-full flex-col">
        <div class="relative">
          <nuxt-link
            class="block"
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
              class="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700"
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

          <!-- Bottom gradient overlay with metadata -->
          <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-12">
            <div class="flex items-start gap-2">
              <nuxt-link
                class="pointer-events-auto line-clamp-2 font-bold text-sm leading-tight text-white drop-shadow-md hover:text-gray-200"
                :to="{
                  name: 'forums-forumId-downloads-discussionId',
                  params: {
                    forumId: defaultUniqueName,
                    discussionId: discussionChannel.discussionId,
                  },
                  query: filteredQuery,
                }"
              >
                <HighlightedSearchTerms
                  :search-input="searchInput"
                  :text="title"
                />
              </nuxt-link>
              <span
                v-if="discussionChannel.archived"
                class="shrink-0 rounded-full border border-red-400 px-2 text-xs text-red-300"
                >Archived</span
              >
              <span
                v-if="discussionChannel.answered"
                aria-label="This discussion has been answered"
                class="shrink-0 flex items-center gap-1 rounded-full border border-green-400 px-2 py-0.5 text-xs text-green-300"
              >
                <CheckCircleIcon class="h-4 w-4" /> Answered
              </span>
            </div>
            <div class="pointer-events-auto mt-1 text-xs text-gray-200">
              <span>{{ `Posted ${relativeTimeAgo} by` }}</span>
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
                light-text
              />
            </div>
          </div>

          <!-- Top right buttons container -->
          <div class="absolute right-2 top-2 z-10 flex gap-2">
            <!-- Add to Favorites Button -->
            <div
              v-if="discussion"
              class="rounded-md bg-black/50 p-1.5 transition-all duration-200 hover:bg-black/70"
              @click.stop
            >
              <AddToDiscussionFavorites
                :allow-add-to-list="true"
                :discussion-id="discussion.id"
                :discussion-title="discussion.title"
                :initial-is-favorited="(discussionChannel as DiscussionChannel & DiscussionChannelWithFavorited).isFavorited"
                entity-name="Download"
                size="small"
                overlay-style
              />
            </div>

            <!-- Album View Button -->
            <button
              v-if="
                discussion?.Album?.Images?.length &&
                discussion.Album.Images.length > 0
              "
              type="button"
              class="rounded-md bg-black/50 p-2 text-white transition-all duration-200 hover:bg-black/70"
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

        <!-- Tags and actions below the image -->
        <div class="flex flex-col gap-2 px-3 py-2">
          <div
            v-if="tags.length"
            class="flex flex-wrap gap-1 text-xs font-medium text-gray-600"
          >
            <TagComponent
              v-for="tag in tags"
              :key="tag"
              :active="selectedTags.includes(tag)"
              :tag="tag"
              @click="$emit('filterByTag', tag)"
            />
          </div>
          <div class="flex items-center gap-1 dark:text-white">
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
    <ErrorBanner v-if="errorMessage" :text="errorMessage" />
  </li>
</template>

<style scoped>
.highlighted {
  background-color: #f9f95d;
}
</style>
