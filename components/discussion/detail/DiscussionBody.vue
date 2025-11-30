<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import EmojiButtons from '@/components/comments/EmojiButtons.vue';
import NewEmojiButton from '@/components/comments/NewEmojiButton.vue';
import Tag from '../../TagComponent.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import 'md-editor-v3/lib/preview.css';
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import { useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { usernameVar, isAuthenticatedVar } from '@/cache';

const router = useRouter();

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

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  discussion: {
    type: Object as PropType<Discussion | null>,
    required: false,
    default: null,
  },
  discussionChannelId: {
    type: String,
    required: false,
    default: '',
  },
  downloadMode: {
    type: Boolean,
    required: false,
    default: false,
  },
  emojiJson: {
    type: String,
    required: false,
    default: '',
  },
  showEmojiButton: {
    type: Boolean,
    required: false,
    default: true,
  },
  shaded: {
    type: Boolean,
    required: false,
    default: false,
  },
  wordLimit: {
    type: Number,
    required: false,
    default: 1000,
  },
});

// Computed properties for discussion body and links
const bodyText = computed(() => {
  return props.discussion?.body || '';
});

// Scroll element setup, ensure document.documentElement is accessed only on the client-side
const scrollElement = ref<HTMLElement | null>(null);

// State for showing/hiding sensitive content
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

onMounted(() => {
  if (import.meta.client) {
    scrollElement.value = document.documentElement;
  }
});

// Method for filtering discussions by tag
const filterByTag = (tag: string) => {
  router.push({
    name: 'forums-forumId-discussions',
    params: {
      forumId: props.channelId,
    },
    query: {
      tags: tag,
    },
  });
};

const hasAlbum = computed(() => {
  return props.discussion?.Album && props.discussion.Album?.Images?.length > 0;
});

const hasEmoiji = computed(() => {
  return props.discussionChannelId && props.emojiJson && props.showEmojiButton;
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Sensitive content concealment box -->
    <div
      v-if="
        hasSensitiveContent &&
        !sensitiveContentRevealed &&
        !userAllowsSensitiveContent
      "
      class="rounded border bg-gray-200 p-4 text-center dark:bg-gray-800"
    >
      <p class="mb-3 text-gray-600 dark:text-gray-300">
        This content has been marked as potentially sensitive.
      </p>
      <RequireAuth>
        <template #has-auth>
          <button
            type="button"
            class="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            @click="revealSensitiveContent"
          >
            Reveal sensitive content
          </button>
        </template>
        <template #does-not-have-auth>
          <button
            type="button"
            class="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Log in to reveal sensitive content
          </button>
        </template>
      </RequireAuth>
    </div>

    <!-- Discussion body (hidden when sensitive and not revealed) -->
    <div
      v-if="discussion?.body && !downloadMode && shouldShowContent"
      class="rounded"
      :class="[shaded ? 'bg-gray-100 dark:bg-gray-700' : '']"
    >
      <MarkdownPreview :text="bodyText" :disable-gallery="false" />
    </div>

    <!-- Album slot (hidden when sensitive and not revealed) -->
    <div
      v-if="shouldShowContent && (hasAlbum || downloadMode)"
      class="w-full min-w-0 overflow-hidden"
    >
      <slot name="album-slot" />
    </div>
    <div v-if="showEmojiButton && hasEmoiji" :key="emojiJson" class="flex">
      <EmojiButtons
        :key="emojiJson"
        :discussion-channel-id="discussionChannelId"
        :emoji-json="emojiJson"
      />
    </div>
    <div
      v-if="discussion?.Tags && discussion.Tags.length > 0"
      class="flex gap-2"
    >
      <Tag
        v-for="tag in discussion?.Tags"
        :key="tag.text"
        class="mt-2"
        :tag="tag.text"
        @click="filterByTag(tag.text)"
      />
    </div>

    <div v-if="!downloadMode">
      <slot name="mark-answered-slot" />
    </div>
    <slot name="activity-feed-slot" />
    <div class="flex items-center gap-2">
      <slot name="button-slot" />
      <NewEmojiButton
        v-if="showEmojiButton && !downloadMode"
        :discussion-channel-id="discussionChannelId"
      />
    </div>
  </div>
</template>

<style scoped>
li {
  list-style-type: disc;
}
</style>
