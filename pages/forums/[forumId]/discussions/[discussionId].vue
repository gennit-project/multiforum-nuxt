<script lang="ts" setup>
import { config } from '@/config';
import { ref, watchEffect, computed } from 'vue';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import 'md-editor-v3/lib/style.css';
import { useModProfileName } from '@/composables/useAuthState';
import { useRoute, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { buildDiscussionHead } from '@/utils/discussionSeo';

const modProfileNameVar = useModProfileName();

const route = useRoute();

const updateDiscussionId = () => {
  if (typeof route.params.discussionId === 'string') {
    return route.params.discussionId;
  }
  return '';
};
const discussionId = ref(updateDiscussionId());

watchEffect(() => {
  discussionId.value = updateDiscussionId();
});

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const { result: discussionResult } = useQuery(GET_DISCUSSION, {
  id: discussionId,
  loggedInModName: modProfileNameVar.value,
  channelUniqueName: channelId.value,
});

// Reactive meta data that updates when discussion data changes. The pure
// tag-building logic lives in utils/discussionSeo.ts (unit-tested).
const metaData = computed(() => {
  try {
    return buildDiscussionHead({
      discussions: discussionResult.value?.discussions,
      channelId: channelId.value,
      discussionId: discussionId.value,
      serverDisplayName: config.serverDisplayName,
      baseUrl: import.meta.env.VITE_BASE_URL,
    });
  } catch (error) {
    console.error('Error setting meta tags:', error);
    return {
      title: 'Discussion',
      meta: [
        {
          name: 'description',
          content: `View this discussion on ${config.serverDisplayName}`,
        },
      ],
    };
  }
});

// Set meta tags reactively
useHead(metaData);
</script>

<template>
  <div
    class="relative w-full max-w-screen-2xl flex-1 overflow-hidden p-0 focus:outline-none xl:order-last"
  >
    <div class="flex w-full justify-center space-y-4 overflow-x-hidden">
      <ErrorBanner v-if="!discussionId" text="Discussion not found" />
      <DiscussionDetailContent
        v-else
        :key="discussionId"
        :discussion-id="discussionId"
        :logged-in-user-mod-name="modProfileNameVar || ''"
      />
    </div>
  </div>
</template>

<style>
h1 {
  font-size: 2.65em;
  padding-bottom: 0.3em;
}
</style>
