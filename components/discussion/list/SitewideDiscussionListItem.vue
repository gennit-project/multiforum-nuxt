<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import type {
  Discussion,
  DiscussionChannel,
  Tag,
} from '@/__generated__/graphql';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import TagComponent from '@/components/TagComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import { relativeTime } from '@/utils';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { usernameVar, isAuthenticatedVar } from '@/cache';
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

const emit = defineEmits(['filterByTag', 'select']);

const route = useRoute();

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
  const serverRoles = props.discussion?.Author?.ServerRoles;
  return serverRoles?.[0]?.showAdminTag || false;
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
  if (!props.isSelectable || !props.discussion) return;
  emit('select', {
    discussionId: props.discussion.id,
    channelId: forumId.value,
  });
};
</script>

<template>
  <li
    class="list-none px-4 py-2"
    :class="{
      'bg-gray-100 dark:bg-gray-700': isSelected,
    }"
  >
    <div class="flex w-full justify-between">
      <div class="w-full">
        <nuxt-link
          v-if="discussion"
          :to="getDetailLink()"
          class="-ml-1 mb-1 flex items-center gap-2 text-xs dark:text-white"
        >
          <div class="flex items-center text-orange-700 dark:text-white">
            <AvatarComponent
              :text="
                discussion.DiscussionChannels?.[0]?.channelUniqueName || ''
              "
              :is-square="true"
              :is-decorative="true"
              class="mr-1 h-6 w-6"
            />
            <span>{{
              discussion.DiscussionChannels?.[0]?.channelUniqueName || ''
            }}</span>
            <span
              v-if="submittedToMultipleChannels"
              class="ml-1 text-gray-500 dark:text-gray-400"
            >
              and {{ channelCount - 1 }} more
            </span>
          </div>
        </nuxt-link>
        <div class="flex gap-2">
          <div>
            <div class="flex items-center gap-2">
              <nuxt-link
                v-if="discussion"
                :to="getDetailLink()"
                class="w-full text-left lg:hidden"
              >
                <div class="flex items-start gap-2">
                  <span
                    :class="isSelected ? 'text-black' : ''"
                    class="cursor-pointer text-sm hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
                  >
                    <HighlightedSearchTerms
                      :text="title"
                      :search-input="searchInput"
                    />
                  </span>
                  <span
                    v-if="hasSensitiveContent"
                    class="rounded-full border border-orange-600 px-2 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                  >
                    Sensitive
                  </span>
                </div>
              </nuxt-link>
              <button
                v-if="discussion"
                type="button"
                class="hidden w-full text-left lg:block"
                @click="handleSelect"
              >
                <div class="flex items-start gap-2">
                  <span
                    :class="isSelected ? 'text-black' : ''"
                    class="cursor-pointer text-sm hover:text-gray-500 dark:text-gray-100 dark:hover:text-gray-300"
                  >
                    <HighlightedSearchTerms
                      :text="title"
                      :search-input="searchInput"
                    />
                  </span>
                  <span
                    v-if="hasSensitiveContent"
                    class="rounded-full border border-orange-600 px-2 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                  >
                    Sensitive
                  </span>
                </div>
              </button>
            </div>
            <div
              class="pt-1 text-xs text-gray-500 no-underline dark:text-gray-300"
            >
              <!-- Use div instead of p to avoid invalid HTML (button inside p) -->
              <div class="whitespace-normal">
                <!-- Comment count -->
                <template v-if="discussion && !submittedToMultipleChannels">
                  <nuxt-link :to="getDetailLink()" class="inline">
                    {{ commentCount }}
                    {{ commentCount === 1 ? 'comment' : 'comments' }}
                  </nuxt-link>
                </template>

                <template v-else-if="discussion">
                  <span class="inline-flex">
                    <MenuButton :items="discussionDetailOptions">
                      <span class="inline cursor-pointer">
                        <i
                          class="fa-regular fa-comment mr-1 h-4 w-4"
                          aria-hidden="true"
                        />
                        {{ commentCount }}
                        {{ commentCount === 1 ? 'comment' : 'comments' }} in
                        {{ channelCount }}
                        {{ channelCount === 1 ? 'forum' : 'forums' }}
                        <ChevronDownIcon
                          class="ml-1 inline h-4 w-4"
                          aria-hidden="true"
                        />
                      </span>
                    </MenuButton>
                  </span>
                </template>

                <span class="mx-1 inline">•</span>
                <span class="inline">Posted {{ relative }} by</span>
                <div class="inline-flex">
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
                <div class="inline-flex">
                  <AddToDiscussionFavorites
                    v-if="discussion"
                    :allow-add-to-list="true"
                    :discussion-id="discussion.id"
                    :discussion-title="discussion.title"
                    :initial-is-favorited="(discussion as any).isFavorited"
                    size="small"
                  />
                </div>
              </div>
            </div>
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
              <i v-else class="fa-solid fa-x mr-1 text-xs" aria-hidden="true" />
              {{ isExpanded ? 'Collapse' : 'Expand' }}
            </button>
            <div
              v-if="
                discussion &&
                (discussion.body || discussion.Album) &&
                isExpanded
              "
              class="my-2 w-full max-w-full overflow-hidden border-l-2 border-gray-300 bg-gray-100 pt-2 dark:bg-black"
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
        </div>
      </div>
    </div>
  </li>
</template>
