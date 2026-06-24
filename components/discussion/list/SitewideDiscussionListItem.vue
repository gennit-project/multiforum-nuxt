<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from '@/__generated__/graphql';
import type { DiscussionWithFavorited } from '@/types/Discussion';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import TagComponent from '@/components/TagComponent.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import { relativeTime } from '@/utils';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { useUsername, useIsAuthenticated } from '@/composables/useAuthState';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

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

const forumId = computed(() => {
  if (!props.discussion) return '';
  const firstChannel = safeArrayFirst(props.discussion.DiscussionChannels);
  return firstChannel?.channelUniqueName || '';
});

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
      label: `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'} in ${dc.channelUniqueName}`,
      value: discussionDetailLink,
    };
  }).sort((a, b) => b.label.localeCompare(a.label));
});

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
const tags = computed(
  () => props.discussion?.Tags.map((tag: Tag) => tag.text) || []
);
const authorUsername = computed(
  () => props.discussion?.Author?.username || 'Deleted'
);
const relative = computed(() =>
  props.discussion ? relativeTime(props.discussion.createdAt) : ''
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
      if (firstOrdered?.url) return firstOrdered.url;
    }
    if (images[0]?.url) return images[0].url;
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
const displayChannelIcons = computed(() => channelIcons.value.slice(0, 3));
const extraChannelCount = computed(() =>
  Math.max(0, channelIcons.value.length - 3)
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
      class="m-2 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 lg:m-0 lg:block lg:gap-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-4 lg:dark:bg-transparent"
      :class="{
        'ring-2 ring-orange-400 dark:ring-orange-500 lg:bg-gray-100 lg:ring-0 dark:lg:bg-gray-800':
          isSelected,
      }"
    >
      <!-- Discussion row -->
      <div class="flex items-start gap-3">
        <div class="flex flex-shrink-0 flex-col items-center gap-1">
          <div v-if="displayChannelIcons.length" class="flex -space-x-2">
            <div
              v-for="channel in displayChannelIcons"
              :key="channel.uniqueName"
              class="group/chicon relative"
            >
              <AvatarComponent
                class="h-8 w-8 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900"
                :text="channel.uniqueName"
                :src="channel.iconURL"
                :is-small="true"
                :is-square="false"
                :is-decorative="true"
              />
              <span
                class="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/chicon:opacity-100 dark:bg-gray-700"
              >
                {{ channel.uniqueName }}
              </span>
            </div>
          </div>
          <span
            v-if="extraChannelCount > 0"
            class="text-center text-[10px] leading-tight text-gray-500 dark:text-gray-400"
          >
            and {{ extraChannelCount }} more
          </span>
          <AddToDiscussionFavorites
            v-if="discussion"
            :allow-add-to-list="true"
            :discussion-id="discussion.id"
            :discussion-title="discussion.title"
            :initial-is-favorited="(discussion as Discussion & DiscussionWithFavorited).isFavorited"
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
                class="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                />
              </span>
              <span
                v-if="hasSensitiveContent"
                class="mt-1 flex-shrink-0 rounded-full border border-amber-700 px-2 text-xs text-amber-700 dark:border-orange-400 dark:text-orange-400"
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
                class="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100"
              >
                <HighlightedSearchTerms
                  :text="title"
                  :search-input="searchInput"
                />
              </span>
              <span
                v-if="hasSensitiveContent"
                class="mt-1 flex-shrink-0 rounded-full border border-amber-700 px-2 text-xs text-amber-700 dark:border-orange-400 dark:text-orange-400"
              >
                Sensitive
              </span>
            </div>
          </nuxt-link>
          <div
            class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <nuxt-link
              v-if="discussion"
              :to="{
                name: 'forums-forumId-discussions',
                params: { forumId },
              }"
              class="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
            >
              {{ forumId }}
            </nuxt-link>
            <span
              v-if="submittedToMultipleChannels"
              class="text-gray-400 dark:text-gray-500"
            >
              +{{ channelCount - 1 }}
            </span>
            <span aria-hidden="true">•</span>
            <span>{{ relative }}</span>
            <span aria-hidden="true">•</span>
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
            <span aria-hidden="true">•</span>
            <template v-if="discussion && !submittedToMultipleChannels">
              <nuxt-link
                :to="getDetailLink()"
                class="flex items-center gap-1 hover:underline"
              >
                <i class="fa-regular fa-comment" aria-hidden="true" />
                {{ commentCount }}
              </nuxt-link>
            </template>
            <template v-else-if="discussion">
              <MenuButton :items="discussionDetailOptions">
                <span class="flex cursor-pointer items-center gap-1">
                  <i class="fa-regular fa-comment" aria-hidden="true" />
                  {{ commentCount }} in {{ channelCount }}
                  <ChevronDownIcon class="h-3 w-3" aria-hidden="true" />
                </span>
              </MenuButton>
            </template>
            <template v-if="discussion && (discussion.body || discussion.Album)">
              <span aria-hidden="true">•</span>
              <button
                type="button"
                class="flex items-center gap-1 hover:underline"
                :aria-expanded="isExpanded"
                @click="isExpanded = !isExpanded"
              >
                <i
                  :class="isExpanded ? 'fa-solid fa-xmark' : 'fa-solid fa-expand'"
                  class="text-[10px]"
                  aria-hidden="true"
                />
                {{ isExpanded ? 'Collapse' : 'Expand' }}
              </button>
            </template>
          </div>
        </div>
        <nuxt-link
          v-if="thumbnailUrl && discussion"
          :to="getDetailLink()"
          class="flex-shrink-0 lg:hidden"
        >
          <img
            :src="thumbnailUrl"
            :alt="title"
            class="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
          >
        </nuxt-link>
        <nuxt-link
          v-if="thumbnailUrl && discussion"
          :to="getDesktopSelectionLink()"
          class="hidden flex-shrink-0 lg:block"
        >
          <img
            :src="thumbnailUrl"
            :alt="title"
            class="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
          >
        </nuxt-link>
        <nuxt-link
          v-if="discussion"
          :to="getDetailLink()"
          class="flex items-center self-center text-gray-300 dark:text-gray-600 lg:hidden"
          aria-label="Open discussion"
        >
          <i class="fa-solid fa-chevron-right" aria-hidden="true" />
        </nuxt-link>
      </div>

        <div
          v-if="
            discussion && (discussion.body || discussion.Album) && isExpanded
          "
          class="my-2 w-full max-w-full overflow-hidden border-l-2 border-gray-300 bg-gray-100 pt-2 dark:border-gray-700 dark:bg-gray-900"
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
              class="max-w-full break-words px-2 pb-2"
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
        <div
          class="mt-1 flex space-x-1 text-sm font-medium text-gray-600 hover:no-underline"
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
  </li>
</template>
