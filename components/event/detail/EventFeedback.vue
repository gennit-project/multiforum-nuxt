<script lang="ts">
import type { Event } from "@/__generated__/graphql";
import BackLink from "@/components/BackLink.vue";
import { GET_EVENT_FEEDBACK } from "@/graphQLData/event/queries";
import { useQuery } from "@vue/apollo-composable";
import { computed, defineComponent } from "vue";
import { useRoute } from "vue-router";
import EventHeader from "./EventHeader.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import InfoBanner from "@/components/InfoBanner.vue";
import EventBody from "./EventBody.vue";
import LoadMore from "@/components/LoadMore.vue";

const PAGE_LIMIT = 10;

export default defineComponent({
  components: {
    BackLink,
    EventBody,
    EventHeader,
    ErrorBanner,
    InfoBanner,
    LoadMore,
    MarkdownPreview,
    PageNotFound,
  },
  setup: () => {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
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

          const prevFeedbackComments =
            previousResult.events[0].FeedbackComments;
          const newFeedbackComments =
            fetchMoreResult.events[0].FeedbackComments;

          return {
            ...previousResult,
            events: [
              {
                ...previousResult.events[0],
                FeedbackComments: [
                  ...prevFeedbackComments,
                  ...newFeedbackComments,
                ],
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

    return {
      channelId,
      event,
      getEventLoading,
      getEventError,
      feedbackComments,
      feedbackCommentsAggregate,
      loadMore,
      reachedEndOfResults,
      route,
      timeAgo,
    };
  },
});
</script>
<template>
  <div
    class="w-full max-w-7xl space-y-4 rounded-lg bg-white py-2 dark:bg-gray-800 sm:px-2 md:px-5"
  >
    <div class="align-center mx-1 flex justify-between px-1 sm:mt-2 md:mt-5">
      <BackLink
        :link="`/forums/f/${channelId}/events/e/${event?.id}`"
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
    <p class="px-2">
      This page collects feedback on this event:
    </p>
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
          />
          <EventBody
            v-if="event?.description"
            :event="event"
          />
        </div>
      </div>
    </div>
    <h2 class="text-wrap text-center text-xl font-bold dark:text-gray-200">
      Feedback Comments ({{ feedbackCommentsAggregate }})
    </h2>
    <InfoBanner
      v-if="feedbackCommentsAggregate > 0"
      :text="'Feedback should be respectful and constructive. If the feedback is rude or non-actionable, please report it.'"
    />
    <div
      v-if="feedbackCommentsAggregate === 0"
      class="text-center text-gray-500 dark:text-gray-300"
    >
      No feedback yet.
    </div>
    <div
      v-for="comment in feedbackComments"
      :key="comment.id"
    >
      <div
        class="flex gap-2 text-sm leading-8 text-gray-500 dark:text-gray-300"
      >
        <AvatarComponent
          v-if="comment.CommentAuthor?.displayName"
          class="h-36 w-36 border-2 shadow-sm dark:border-gray-800"
          :text="comment.CommentAuthor.displayName"
          :is-small="true"
          :is-square="false"
        />
        <span class="mr-0.5">
          <router-link
            v-if="comment.CommentAuthor?.displayName"
            :to="{
              name: 'ModProfile',
              params: {
                modId: comment.CommentAuthor.displayName,
              },
            }"
            class="font-medium text-gray-900 hover:underline dark:text-gray-200"
          >{{ comment.CommentAuthor?.displayName }}</router-link>
        </span>
        <span class="whitespace-nowrap">{{
          `gave feedback in ${comment.Channel?.uniqueName} ${timeAgo(new Date(comment.createdAt))}`
        }}</span>
      </div>

      <div class="ml-12 border-l-2 border-gray-200 dark:border-gray-500">
        <MarkdownPreview
          v-if="comment.text"
          class="-ml-4"
          :text="comment.text"
          :disable-gallery="true"
        />
      </div>
    </div>
    <LoadMore
      v-if="!getEventLoading && !reachedEndOfResults"
      :reached-end-of-results="reachedEndOfResults"
      @load-more="loadMore"
    />
    <div v-if="getEventLoading">
      Loading...
    </div>
  </div>
</template>
