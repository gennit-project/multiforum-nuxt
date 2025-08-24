<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { Discussion } from '@/__generated__/graphql';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import { usernameVar } from '@/cache';

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  discussion: {
    type: Object as () => Discussion | null,
    default: null,
  },
  aggregateCommentCount: {
    type: Number,
    default: 0,
  },
});

const route = useRoute();
const router = useRouter();

const loggedInUserIsAuthor = computed(() => {
  return props.discussion?.Author?.username === usernameVar.value;
});
</script>

<template>
  <div>
    <!-- Download mode tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-8 px-2">
        <nuxt-link
          :to="{
            name: 'forums-forumId-downloads-discussionId',
            params: {
              forumId: channelId,
              discussionId: discussionId,
            },
          }"
          class="border-b-2 px-1 py-2 text-sm font-medium"
          :class="
            typeof $route.name === 'string' &&
            ($route.name.includes('description') ||
              $route.name === 'forums-forumId-downloads-discussionId')
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          "
        >
          Description
        </nuxt-link>
        <nuxt-link
          :to="{
            name: 'forums-forumId-downloads-discussionId-comments',
            params: {
              forumId: channelId,
              discussionId: discussionId,
            },
          }"
          class="border-b-2 px-1 py-2 text-sm font-medium"
          :class="
            typeof $route.name === 'string' &&
            $route.name.includes('comments')
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          "
        >
          Comments ({{ aggregateCommentCount }})
        </nuxt-link>
      </nav>
    </div>

    <!-- Tab content via router-view -->
    <div class="mt-2 w-full">
      <NuxtPage :discussion="discussion" />
      <!-- Fallback to description if no nested route matches -->
      <div
        v-if="$route.name === 'forums-forumId-downloads-discussionId'"
        class="px-2"
      >
        <div
          class="flex flex-col-reverse gap-4 lg:flex-row lg:items-start lg:justify-between"
        >
          <!-- Description content -->
          <div v-if="discussion?.body" class="min-w-0 flex-1">
            <MarkdownPreview
              :disable-gallery="false"
              :text="discussion.body"
            />
          </div>
          <div
            v-else
            class="min-w-0 flex-1 py-8 text-center text-gray-500 dark:text-gray-400"
          >
            No description available for this download.
          </div>
          <div
            v-if="loggedInUserIsAuthor && discussion"
            class="flex w-full justify-end lg:w-auto"
          >
            <button
              type="button"
              class="hover:bg-gray-50 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              data-testid="edit-download-button-fallback"
              @click="
                router.push(
                  `/forums/${channelId}/downloads/${discussionId}/description`
                )
              "
            >
              <PencilIcon class="h-4 w-4" />
              Edit Description
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>