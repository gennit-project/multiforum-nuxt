<script lang="ts" setup>

import { GetEventDocument, GetEventFeedbackDocument as GET_EVENT_FEEDBACK } from '@/__generated__/operations';
import { useQuery } from '@vue/apollo-composable';
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import EventHeader from '@/components/event/detail/EventHeader.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import EventBody from '@/components/event/detail/EventBody.vue';
import FeedbackSection from '@/components/comments/FeedbackSection.vue';

const PAGE_LIMIT = 10;

const route = useRoute();

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const eventId = computed(() => {
  if (typeof route.params.eventId === 'string') {
    return route.params.eventId;
  }
  return '';
});

const {
  result: getEventResult,
  error: getEventError,
  loading: getEventLoading,
  fetchMore,
} = useQuery(GET_EVENT_FEEDBACK, () => ({
  id: eventId.value,
  limit: PAGE_LIMIT,
  offset: 0,
}), () => ({ enabled: !!eventId.value, keepPreviousResult: false }));

// The feedback query returns a summary, not the full interactive event header.
const { result: detailResult, loading: detailLoading, error: detailError } = useQuery(
  GetEventDocument, () => ({ id: eventId.value, channelUniqueName: channelId.value }),
  () => ({ enabled: !!eventId.value, fetchPolicy: 'cache-first', keepPreviousResult: false })
);
const detail = computed(() => !detailLoading.value && !detailError.value ? detailResult.value?.events.find((item) => item.id === eventId.value) : undefined);

const event = computed(() => {
  if (getEventError.value) {
    return null;
  }
  return getEventResult.value?.events?.[0] || null;
});

const feedbackComments = computed(() => {
  if (event.value) {
    return event.value.FeedbackComments;
  }
  return [];
});

const feedbackCommentsAggregate = computed(() => {
  if (event.value) {
    return event.value.FeedbackCommentsConnection?.aggregate?.count?.nodes || 0;
  }
  return 0;
});

const loadMore = () => {
  fetchMore({
    variables: {
      offset: feedbackComments.value.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      const previous = previousResult.events[0];
      const next = fetchMoreResult?.events[0];
      if (!previous || !next || previous.id !== eventId.value || next.id !== eventId.value) return previousResult;

      const prevFeedbackComments = previous.FeedbackComments;
      const newFeedbackComments = next.FeedbackComments;

      return {
        ...previousResult,
        events: [
          {
            ...previous,
            FeedbackComments: [...prevFeedbackComments, ...newFeedbackComments],
          },
        ],
      };
    },
  });
};

const reachedEndOfResults = computed(() => {
  if (getEventLoading.value || getEventError.value) {
    return false;
  }
  return feedbackComments.value.length === feedbackCommentsAggregate.value;
});
</script>

<template>
  <div
    class="w-full max-w-[theme(screens.2xl)] space-y-4 rounded-lg py-2 sm:px-2 md:px-5 dark:text-white"
  >
    <h1 class="text-center text-2xl font-bold text-wrap dark:text-gray-200">
      Feedback
    </h1>
    <ErrorBanner
      v-if="getEventError"
      class="mt-2 px-4"
      :text="getEventError.message"
    />
    <PageNotFound v-if="!getEventLoading && !getEventError && !event" />
    <p class="mb-4 px-2">This page collects feedback on this event:</p>
    <div class="ml-2 flex flex-col gap-2 border-l pl-4">
      <h3 class="px-2 text-xl font-bold text-wrap sm:tracking-tight">
        {{ event && event.title ? event.title : '[Deleted]' }}
      </h3>

      <div class="space-y-3 px-2">
        <div
          class="rounded-lg border px-4 pb-2 dark:border-gray-700 dark:bg-gray-700 dark:bg-gray-950"
        >
          <EventHeader
            v-if="detail"
            :event-data="detail"
            :channel-id="channelId"
            :show-menu-buttons="false"
          />
          <EventBody v-if="detail?.description" :event="detail" />
        </div>
      </div>
      <router-link
        v-if="event"
        :to="`/forums/${channelId}/events/${event.id}`"
        class="text-brand-500 dark:text-brand-400 text-sm hover:underline"
        >View Event</router-link
      >
    </div>
    <FeedbackSection
      v-if="feedbackCommentsAggregate > 0"
      :loading="getEventLoading"
      :feedback-comments="feedbackComments"
      :feedback-comments-aggregate="feedbackCommentsAggregate"
      :reached-end-of-results="reachedEndOfResults"
      :load-more="loadMore"
      :show-feedback-submitted-successfully="false"
      :add-feedback-comment-to-comment="() => {}"
      :add-feedback-comment-to-comment-loading="false"
      :add-feedback-comment-to-comment-error="''"
      :show-feedback-form-modal="false"
    />
  </div>
</template>
