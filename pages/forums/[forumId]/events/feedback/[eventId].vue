<script lang="ts" setup>
import type { Event } from "@/__generated__/graphql";
import BackLink from "@/components/BackLink.vue";
import { GET_EVENT_FEEDBACK } from "@/graphQLData/event/queries";
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { useRoute } from "nuxt/app";
import EventHeader from "@/components/event/detail/EventHeader.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import EventBody from "@/components/event/detail/EventBody.vue";
import FeedbackSection from "@/components/comments/FeedbackSection.vue";

const PAGE_LIMIT = 10;

const route = useRoute();

const channelId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const eventId = computed(() => {
  if (typeof route.params.eventId === "string") {
    return route.params.eventId;
  }
  return "";
});

const {
  result: getEventResult,
  error: getEventError,
  loading: getEventLoading,
  fetchMore,
} = useQuery(GET_EVENT_FEEDBACK, {
  id: eventId,
  limit: PAGE_LIMIT,
  offset: 0,
});

const event = computed<Event>(() => {
  if (getEventError.value) {
    return null;
  }
  return getEventResult.value?.events[0] || null;
});

const feedbackComments = computed(() => {
  if (event.value) {
    return event.value.FeedbackComments;
  }
  return [];
});

const feedbackCommentsAggregate = computed(() => {
  if (event.value) {
    return event.value.FeedbackCommentsAggregate?.count || 0;
  }
  return 0;
});

const loadMore = () => {
  fetchMore({
    variables: {
      offset: feedbackComments.value.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;

      const prevFeedbackComments = previousResult.events[0].FeedbackComments;
      const newFeedbackComments = fetchMoreResult.events[0].FeedbackComments;

      return {
        ...previousResult,
        events: [
          {
            ...previousResult.events[0],
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
    class="w-full max-w-screen-2xl space-y-4 rounded-lg bg-white dark:text-white py-2 dark:bg-gray-800 sm:px-2 md:px-5"
  >
    <div class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5">
      <BackLink
        :link="`/forums/${channelId}/events/${event?.id}`"
        :data-testid="'event-detail-back-link'"
      />
    </div>
    <h1 class="text-wrap text-center text-2xl font-bold dark:text-gray-200">
      Feedback
    </h1>
    <ErrorBanner
      v-if="getEventError"
      class="mt-2 px-4"
      :text="getEventError.message"
    />
    <PageNotFound v-if="!getEventLoading && !getEventError && !event" />
    <p class="px-2">This page collects feedback on this event:</p>
    <div class="ml-2 flex flex-col gap-2 border-l pl-4">
      <h3 class="text-wrap px-1 px-2 text-xl font-bold sm:tracking-tight">
        {{ event && event.title ? event.title : "[Deleted]" }}
      </h3>

      <div class="space-y-3 px-2">
        <div
          class="dark:bg-gray-950 rounded-lg border px-4 pb-2 dark:border-gray-700 dark:bg-gray-700"
        >
          <EventHeader
            v-if="event"
            :event-data="event"
            :channel-id="channelId"
            :event-channel-id
            :show-menu-buttons="false"
          />
          <EventBody v-if="event?.description" :event="event" />
        </div>
      </div>
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
