<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
import type {
  DiscussionChannelWithFlairs,
  DiscussionWithFavorited,
} from '@/types/Discussion';
import DiscussionFlairBadges from '@/components/discussion/DiscussionFlairBadges.vue';
import { selectDiscussionForum } from '@/utils/selectDiscussionForum';
import ChannelIconStack from '@/components/channel/ChannelIconStack.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import ForumSubmissions from '@/components/discovery/ForumSubmissions.vue';
import ExpandIcon from '@/components/icons/ExpandIcon.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import AppImage from '@/components/image/AppImage.vue';
import XmarkIcon from '@/components/icons/XmarkIcon.vue';
import { stableRelativeTime } from '@/utils';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { useUsername, useIsAuthenticated } from '@/composables/useAuthState';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';
import { getPreferredImageUrl } from '@/utils/imageVariants';

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();
// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    default: null,
  },
  isSelectable: {
    type: Boolean,
    default: false,
  },
  selectedDiscussionId: {
    type: String,
    default: '',
  },
  score: {
    type: Number,
    default: 0,
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
    default: false,
  },
});

defineEmits<{
  (e: 'filterByTag', tag: string): void;
}>();

const route = useRoute();
const { serverAdminUsernames } = useServerRoleMembership();

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

const forumId = computed(() =>
  selectDiscussionForum(
    props.discussion?.DiscussionChannels || [],
    isSelected.value ? route.query.selectedForum : undefined
  )
);

// UI state is now handled via props

// Local state for this specific discussion item's expanded/collapsed state
// Initial value is based on the defaultExpanded prop
const isExpanded = ref(props.defaultExpanded);

const authorIsAdmin = computed(() => {
  return (
    getServerRoleBadge({
      username: props.discussion?.Author?.username,
      adminUsernames: serverAdminUsernames.value,
    }) === 'serverAdmin'
  );
});

const getDetailLink = () => {
  if (!props.discussion) {
    return {
      name: 'forums-forumId-discussions',
      params: {
        forumId: forumId.value,
      },
    };
  }
  return {
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: forumId.value,
      discussionId: props.discussion.id,
    },
  };
};

const getDesktopSelectionLink = () => {
  if (!props.discussion) {
    return {
      path: route.path,
      query: route.query,
    };
  }

  return {
    path: route.path,
    query: {
      ...route.query,
      selectedDiscussionId: props.discussion.id,
      selectedForum: forumId.value,
    },
  };
};

const discussionIdInParams = computed(() =>
  typeof route.params.discussionId === 'string' ? route.params.discussionId : ''
);
const discussionId = computed(() => props.discussion?.id || '');
const isSelected = computed(() => {
  if (props.selectedDiscussionId) {
    return props.selectedDiscussionId === discussionId.value;
  }
  return discussionIdInParams.value === discussionId.value;
});
const title = computed(() => props.discussion?.title || '[Deleted]');
const flairGroups = computed(() =>
  (props.discussion?.DiscussionChannels || [])
    .map((discussionChannel) => ({
      channelName: discussionChannel.channelUniqueName,
      flairs: (discussionChannel as DiscussionChannelWithFlairs).Flairs || [],
    }))
    .filter((group) => group.flairs.length > 0)
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || 'Deleted'
);
const relative = computed(() =>
  props.discussion ? stableRelativeTime(props.discussion.createdAt) : ''
);

// Thumbnail for the mobile card layout. Prefers the first album image
// (respecting imageOrder), then falls back to the first image embedded in the
// discussion body markdown so image posts without an album still show one.
const thumbnailUrl = computed(() => {
  const album = props.discussion?.Album;
  const images = album?.Images || [];
  if (images.length) {
    const order = album?.imageOrder || [];
    if (order.length) {
      const firstOrdered = images.find((img) => img?.id === order[0]);
      if (firstOrdered) {
        return (
          getPreferredImageUrl({
            source: firstOrdered,
            preferred: ['list160', 'list80'],
            originalUrl: firstOrdered.url,
          }) || ''
        );
      }
    }
    if (images[0]) {
      return (
        getPreferredImageUrl({
          source: images[0],
          preferred: ['list160', 'list80'],
          originalUrl: images[0].url,
        }) || ''
      );
    }
  }

  const body = props.discussion?.body || '';
  const markdownImage = body.match(/!\[[^\]]*\]\(([^)\s]+)\)/);
  if (markdownImage?.[1]) return markdownImage[1];
  const htmlImage = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImage?.[1]) return htmlImage[1];

  return '';
});

// Channel icons for the mobile card. A discussion can be posted to multiple
// forums; we show up to three overlapping channel icons and an "and N more"
// label for the remainder.
const channelIcons = computed(() =>
  (props.discussion?.DiscussionChannels || []).map((dc: DiscussionChannel) => ({
    uniqueName: dc.channelUniqueName,
    iconURL: dc.Channel?.channelIconURL || '',
  }))
);
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
</script>

<template>
  <li class="list-none">
    <div
      class="flex flex-col gap-1 rounded-xl border px-3 py-2 transition-colors"
      :class="{
        'border-brand-600 bg-brand-50/50 dark:border-brand-400 dark:bg-gray-900':
          isSelected,
        'border-gray-200 bg-white hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-600':
          !isSelected,
      }"
    >
      <!-- Discussion row -->
      <div class="flex items-start gap-3">
        <div class="flex shrink-0 flex-col items-center gap-1">
          <ChannelIconStack
            :channels="channelIcons"
            :max-visible="1"
            :show-extra-count="false"
            tooltip-position-class="pointer-events-none absolute -top-8 left-0 z-30 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/chicon:opacity-100 dark:bg-gray-700"
          />
          <AddToDiscussionFavorites
            v-if="discussion"
            :allow-add-to-list="true"
            :discussion-id="discussion.id"
            :discussion-title="discussion.title"
            :initial-is-favorited="
              (discussion as Discussion & DiscussionWithFavorited).isFavorited
            "
            size="small"
          />
        </div>
        <div class="min-w-0 flex-1">
          <nuxt-link
            v-if="discussion"
            :to="getDetailLink()"
            class="block lg:hidden"
          >
            <div class="flex items-start gap-2">
              <span
                class="text-[15px] leading-snug font-semibold text-gray-900 dark:text-gray-100"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                />
              </span>
              <span
                v-if="hasSensitiveContent"
                class="dark:border-brand-400 dark:text-brand-400 mt-1 shrink-0 rounded-full border border-amber-700 px-2 text-xs text-amber-700"
              >
                Sensitive
              </span>
            </div>
          </nuxt-link>
          <nuxt-link
            v-if="discussion"
            :to="getDesktopSelectionLink()"
            class="hidden lg:block"
          >
            <div class="flex items-start gap-2">
              <span
                class="text-[15px] leading-snug font-semibold text-gray-900 dark:text-gray-100"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                />
              </span>
              <span
                v-if="hasSensitiveContent"
                class="dark:border-brand-400 dark:text-brand-400 mt-1 shrink-0 rounded-full border border-amber-700 px-2 text-xs text-amber-700"
              >
                Sensitive
              </span>
            </div>
          </nuxt-link>
          <div
            class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <span class="inline-flex items-center gap-x-1.5 whitespace-nowrap">
              <span>{{ relative }}</span>
            </span>
            <span class="inline-flex items-center gap-x-1.5 whitespace-nowrap">
              <span aria-hidden="true">•</span>
              <UsernameWithTooltip
                v-if="authorUsername"
                :is-server-admin="authorIsAdmin"
                :username="authorUsername"
                :src="discussion?.Author?.profilePicURL || ''"
                :variant-source="discussion?.Author || null"
                :display-name="discussion?.Author?.displayName || ''"
                :comment-karma="discussion?.Author?.commentKarma ?? 0"
                :discussion-karma="discussion?.Author?.discussionKarma ?? 0"
                :account-created="discussion?.Author?.createdAt"
              />
            </span>
            <span
              v-if="discussion && (discussion.body || discussion.Album)"
              class="inline-flex items-center gap-x-1.5 whitespace-nowrap"
            >
              <span aria-hidden="true">•</span>
              <button
                type="button"
                class="inline-flex items-center gap-1 whitespace-nowrap hover:underline"
                :aria-expanded="isExpanded"
                @click="isExpanded = !isExpanded"
              >
                <XmarkIcon
                  v-if="isExpanded"
                  class="h-3 w-3"
                  aria-hidden="true"
                />
                <ExpandIcon v-else class="h-3 w-3" aria-hidden="true" />
                {{ isExpanded ? 'Collapse' : 'Expand' }}
              </button>
            </span>
          </div>
          <ForumSubmissions
            v-if="discussion"
            class="mt-1.5"
            :compact="true"
            :submissions="discussion.DiscussionChannels"
            :content-id="discussion.id"
            kind="discussion"
            :preview="true"
            :selected-forum="isSelected ? forumId : ''"
          />
        </div>
        <nuxt-link
          v-if="thumbnailUrl && discussion && shouldShowContent"
          :to="getDetailLink()"
          class="shrink-0 lg:hidden"
        >
          <AppImage
            :src="thumbnailUrl"
            :alt="title"
            class="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
            :width="64"
            :height="64"
            sizes="(max-width: 639px) 56px, 64px"
          />
        </nuxt-link>
        <nuxt-link
          v-if="thumbnailUrl && discussion && shouldShowContent"
          :to="getDesktopSelectionLink()"
          class="hidden shrink-0 lg:block"
        >
          <AppImage
            :src="thumbnailUrl"
            :alt="title"
            class="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
            :width="64"
            :height="64"
            sizes="64px"
          />
        </nuxt-link>
        <nuxt-link
          v-if="discussion"
          :to="getDetailLink()"
          class="flex items-center self-center text-gray-300 lg:hidden dark:text-gray-600"
          aria-label="Open discussion"
        >
          <RightArrowIcon class="h-4 w-4" aria-hidden="true" />
        </nuxt-link>
      </div>

      <div
        v-if="discussion && (discussion.body || discussion.Album) && isExpanded"
        class="my-2 w-full max-w-full overflow-hidden border-l-2 border-gray-200 bg-gray-50 pt-2 dark:border-gray-700 dark:bg-gray-900"
      >
        <!-- Sensitive content concealment box -->
        <div
          v-if="
            hasSensitiveContent &&
            !sensitiveContentRevealed &&
            !userAllowsSensitiveContent
          "
          class="mx-2 mb-2 rounded border bg-gray-200 p-4 text-center dark:bg-black"
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
          <MarkdownPreview
            v-if="discussion.body"
            :text="discussion.body"
            :word-limit="50"
            :disable-gallery="false"
            :image-max-height="'200px'"
            class="max-w-full px-2 pb-2 wrap-break-word"
          />
          <div
            v-if="discussion.Album"
            class="relative z-30 my-4 w-full max-w-full overflow-hidden bg-black"
          >
            <div class="mx-auto max-w-96">
              <DiscussionAlbum
                :album="discussion.Album"
                :carousel-format="true"
                :discussion-author="authorUsername"
                :discussion-id="discussion.id"
                :show-edit-album="false"
                :expanded-view="false"
              />
            </div>
          </div>
        </template>
      </div>
      <div v-if="flairGroups.length" class="mt-1 flex flex-wrap gap-1.5">
        <DiscussionFlairBadges
          v-for="group in flairGroups"
          :key="group.channelName"
          :flairs="group.flairs"
          :channel-name="group.channelName"
          :show-channel-name="true"
        />
      </div>
    </div>
  </li>
</template>
