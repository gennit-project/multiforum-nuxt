<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import ImageIcon from '@/components/icons/ImageIcon.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import { relativeTime } from '@/utils';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

type AlbumPayload = {
  discussion: Discussion;
  album: Discussion['Album'];
};

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
  searchInput: {
    type: String,
    default: '',
  },
  selectedTags: {
    type: Array as () => string[],
    default: () => [],
  },
  showUploader: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  (e: 'filterByTag', tag: string): void;
  (e: 'openAlbum', payload: AlbumPayload): void;
}>();

const route = useRoute();

const filteredQuery = computed(() => {
  const query = { ...route.query };
  Object.keys(query).forEach((key) => {
    if (!query[key]) {
      Reflect.deleteProperty(query, key);
    }
  });
  return query;
});

const primaryChannel = computed<DiscussionChannel | null>(() => {
  return props.discussion?.DiscussionChannels?.[0] || null;
});

const defaultLink = computed(() => {
  if (!primaryChannel.value) {
    return {};
  }
  return {
    name: 'forums-forumId-downloads-discussionId',
    params: {
      forumId: primaryChannel.value.channelUniqueName,
      discussionId: props.discussion.id,
    },
    query: filteredQuery.value,
  };
});

const commentCount = computed(() => {
  if (!props.discussion?.DiscussionChannels?.length) return 0;
  return props.discussion.DiscussionChannels.reduce((total, channel) => {
    return total + (channel.CommentsAggregate?.count || 0);
  }, 0);
});

const channelCount = computed(
  () => props.discussion?.DiscussionChannels?.length || 0
);

const submittedToMultipleChannels = computed(() => channelCount.value > 1);

const discussionDetailOptions = computed(() => {
  if (!props.discussion?.DiscussionChannels?.length) {
    return [];
  }
  return props.discussion.DiscussionChannels.map((dc) => {
    const comments = dc.CommentsAggregate?.count || 0;
    return {
      label: `${comments} ${comments === 1 ? 'comment' : 'comments'} in ${dc.channelUniqueName}`,
      value: `/forums/${dc.channelUniqueName}/downloads/${props.discussion.id}`,
      event: '',
    };
  });
});

const hasSensitiveContent = computed(
  () => !!props.discussion?.hasSensitiveContent
);

const authorUsername = computed(
  () => props.discussion?.Author?.username || 'Deleted'
);
const authorDisplayName = computed(
  () => props.discussion?.Author?.displayName || ''
);
const authorProfilePicURL = computed(
  () => props.discussion?.Author?.profilePicURL || ''
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

const authorIsAdmin = computed(() => {
  const author = props.discussion?.Author;
  return author?.ServerRoles?.[0]?.showAdminTag || false;
});

const firstAlbumImage = computed(() => {
  const album = props.discussion?.Album;
  if (!album?.Images?.length) return null;
  if (album.imageOrder?.length) {
    const orderedImage = album.Images.find(
      (img) => img.id === album.imageOrder?.[0]
    );
    if (orderedImage?.url) return orderedImage.url;
  }
  return album.Images[0]?.url || null;
});

const relativeCreated = computed(() => {
  if (!props.discussion?.createdAt) return '';
  return relativeTime(props.discussion.createdAt);
});

const handleOpenAlbum = () => {
  if (props.discussion?.Album) {
    emit('openAlbum', {
      discussion: props.discussion,
      album: props.discussion.Album,
    });
  }
};
</script>

<template>
  <li
    class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
  >
    <div class="relative">
      <nuxt-link
        v-if="primaryChannel"
        class="overflow-hidden rounded-md border border-gray-100 dark:border-gray-700"
        :to="defaultLink"
      >
        <div class="bg-gray-50 aspect-square w-full dark:bg-gray-800">
          <img
            v-if="firstAlbumImage"
            :src="firstAlbumImage"
            :alt="discussion.title || 'Download preview'"
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
          class="rounded-md bg-black bg-opacity-50 p-1.5 transition-all duration-200 hover:bg-opacity-70"
          @click.stop
        >
          <AddToDiscussionFavorites
            :allow-add-to-list="true"
            :discussion-id="discussion.id"
            :discussion-title="discussion.title || ''"
            :initial-is-favorited="(discussion as any).isFavorited"
            entity-name="Download"
            size="small"
          />
        </div>

        <!-- Album View Button -->
        <button
          v-if="discussion?.Album?.Images?.length"
          type="button"
          class="rounded-md bg-black bg-opacity-50 p-2 text-white transition-all duration-200 hover:bg-opacity-70"
          title="View album"
          aria-label="View album"
          @click.stop="handleOpenAlbum"
        >
          <ImageIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2 p-2">
      <div class="space-y-1">
        <nuxt-link
          v-if="primaryChannel"
          :to="defaultLink"
          class="font-semibold text-base leading-tight text-gray-900 hover:text-gray-600 dark:text-white"
        >
          <HighlightedSearchTerms
            :text="discussion.title || '[Deleted]'"
            :search-input="searchInput"
          />
        </nuxt-link>
        <span
          v-if="hasSensitiveContent"
          class="ml-2 rounded-full border border-orange-600 px-2 text-[10px] text-orange-600 dark:border-orange-400 dark:text-orange-300"
        >
          Sensitive
        </span>
      </div>

      <div v-if="showUploader" class="text-xs text-gray-600 dark:text-gray-300">
        Posted {{ relativeCreated }} by
        <UsernameWithTooltip
          v-if="authorUsername"
          :username="authorUsername"
          :display-name="authorDisplayName"
          :src="authorProfilePicURL"
          :comment-karma="authorCommentKarma"
          :discussion-karma="authorDiscussionKarma"
          :account-created="authorAccountCreated"
          :is-admin="authorIsAdmin"
        /><template v-if="primaryChannel">
          in
          <nuxt-link
            :to="defaultLink"
            class="text-orange-700 hover:underline dark:text-orange-300"
            >{{ primaryChannel.channelUniqueName }}</nuxt-link
          >
        </template>
      </div>

      <div class="text-xs text-gray-600 dark:text-gray-300">
        <nuxt-link
          v-if="primaryChannel && !submittedToMultipleChannels"
          :to="defaultLink"
          class="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <i class="fa-regular fa-comment text-xs" aria-hidden="true" />
          <span>{{ commentCount }} comments</span>
        </nuxt-link>
        <MenuButton
          v-else-if="submittedToMultipleChannels"
          :items="discussionDetailOptions"
        >
          <span
            class="flex cursor-pointer items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800"
          >
            <i class="fa-regular fa-comment text-xs" aria-hidden="true" />
            {{ commentCount }}
            {{ commentCount === 1 ? 'comment' : 'comments' }} in
            {{ channelCount }}
            {{ channelCount === 1 ? 'forum' : 'forums' }}
            <ChevronDownIcon class="h-4 w-4" />
          </span>
        </MenuButton>
      </div>
    </div>
  </li>
</template>
