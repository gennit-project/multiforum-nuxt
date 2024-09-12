<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import Tag from "@/components/TagComponent.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_EVENT } from "@/graphQLData/event/queries";
import { GET_EVENT_COMMENTS, GET_EVENT_ROOT_COMMENT_AGGREGATE } from "@/graphQLData/comment/queries";
import type { Comment, EventChannel } from "@/__generated__/graphql";
import { DateTime } from "luxon";
import "md-editor-v3/lib/style.css";
import EventFooter from "@/components/event/detail/EventFooter.vue";
import EventHeader from "@/components/event/detail/EventHeader.vue";
import GenericButton from "@/components/GenericButton.vue";
import EventBody from "@/components/event/detail/EventBody.vue";
import ExpandableImage from "@/components/ExpandableImage.vue";
import EventCommentsWrapper from "@/components/event/detail/EventCommentsWrapper.vue";
import EventRootCommentFormWrapper, { COMMENT_LIMIT } from "@/components/event/detail/EventRootCommentFormWrapper.vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import EventChannelLinks from "@/components/event/detail/EventChannelLinks.vue";

const props = defineProps({
  compactMode: {
    type: Boolean,
    default: false,
  },
  issueEventId: {
    type: String,
    required: false,
    default: "",
  },
  showComments: {
    type: Boolean,
    default: true,
  },
  showMenuButtons: {
    type: Boolean,
    default: true,
  },
});

const route = useRoute();
const offset = ref(0);

const eventId = computed(() => {
  if (typeof route.params.eventId === "string") {
    return route.params.eventId;
  }
  return props.issueEventId || "";
});

const channelId = computed(() => (typeof route.params.forumId === "string" ? route.params.forumId : ""));

const { result: eventResult, error: eventError, loading: eventLoading } = useQuery(GET_EVENT, {
  id: eventId.value,
  channelUniqueName: channelId.value,
});

const event = computed(() => eventResult.value?.events?.[0] || null);

const commentSort = computed(() => getSortFromQuery(route.query));
const { result: getEventCommentsResult, loading: getEventCommentsLoading, fetchMore: fetchMoreComments } = useQuery(GET_EVENT_COMMENTS, {
  eventId: eventId.value,
  offset: offset.value,
  limit: COMMENT_LIMIT,
  sort: commentSort.value,
});

watch(commentSort, () => fetchMoreComments({ variables: { sort: commentSort.value } }));

const comments = computed<Comment[]>(() => getEventCommentsResult.value?.getEventComments?.Comments || []);

const { result: getEventRootCommentAggregateResult, error: getEventRootCommentAggregateError, loading: getEventRootCommentAggregateLoading } = useQuery(GET_EVENT_ROOT_COMMENT_AGGREGATE, {
  eventId: eventId.value,
});

const loadedRootCommentCount = computed(() => comments.value.length);

const aggregateRootCommentCount = computed(() => {
  if (getEventRootCommentAggregateLoading.value || getEventRootCommentAggregateError.value) return 0;
  const events = getEventRootCommentAggregateResult.value?.events || [];
  return events[0]?.CommentsAggregate?.count || 0;
});
const previousOffset = ref(0);
const loadMore = () => {
  fetchMoreComments({
    variables: {
      offset: getEventCommentsResult.value?.getEventComments?.Comments?.length || 0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      offset.value += fetchMoreResult.getEventComments.Comments.length;
      return {
        ...previousResult,
        getEventComments: {
          ...previousResult.getEventComments,
          Comments: [...previousResult.getEventComments.Comments, ...fetchMoreResult.getEventComments.Comments],
        },
      };
    },
  });
};

const reachedEndOfResults = computed(() => loadedRootCommentCount.value >= aggregateRootCommentCount.value);

const channelsExceptCurrent = computed(() => {
  if (!event.value) return [];
  return event.value.EventChannels.filter((ec: EventChannel) => ec.channelUniqueName !== channelId.value);
});

const eventIsInThePast = computed(() => {
  if (!event.value) return false;
  return DateTime.fromISO(event.value.startTime) < DateTime.now();
});

const originalPoster = computed(() => event.value?.Poster?.username || "");
</script>

<template>
  <div class="w-full space-y-4 bg-white dark:bg-gray-800 md:px-6">
    <div class="mb-10 flex w-full justify-center rounded-lg">
      <div class="w-full">
        <div class="mt-1 w-full space-y-2">
          <p v-if="eventLoading" class="px-4 lg:px-10">Loading...</p>
          <ErrorBanner v-else-if="eventError" class="px-4 lg:px-10" :text="eventError.message" />
          <div v-else-if="!event">Could not find the event.</div>

          <div v-else-if="eventResult && eventResult.events && event" class="dark:bg-dark-700 mx-auto flex flex-col gap-4 pt-8">
            <ErrorBanner v-if="eventIsInThePast" class="mb-2 mt-2" :text="'This event is in the past.'" />
            <ErrorBanner v-if="event.canceled" data-testid="canceled-event-banner" class="my-2" :text="'This event is canceled.'" />

            <div v-if="route.name === 'MapEventPreview' && !eventLoading && event" class="dark:text-gray-100 md:flex md:items-center md:justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="text-wrap px-1 text-2xl font-bold sm:tracking-tight">{{ event.title }}</h2>
              </div>
            </div>

            <ExpandableImage v-if="event.coverImageURL" :src="event.coverImageURL" :alt="event.title" />

            <div>
              <EventHeader :event-data="event" :show-menu-buttons="showMenuButtons" />
              <EventBody v-if="event.description" :event="event" />

              <div class="p-4">
                <h2 class="text-md mt-4">Add to Calendar</h2>
                <hr>
                <div class="mt-4 flex">
                  <div class="flex flex-row gap-2 text-sm">
                    <div class="flex justify-start">
                      <GenericButton :text="'Google Calendar'" data-testid="add-to-google-calendar-button" @click="addToGoogleCalendar" />
                    </div>
                    <div class="flex justify-center">
                      <GenericButton :text="'iCal'" data-testid="add-to-ical-button" @click="addToiCal" />
                    </div>
                    <div class="flex justify-end">
                      <GenericButton :text="'Outlook'" data-testid="add-to-outlook-button" @click="addToOutlook" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mx-4 my-2">
              <div class="flex space-x-1">
                <Tag v-for="tag in event.Tags" :key="tag.text" class="mt-2" :tag="tag.text" :event-id="eventId" />
              </div>
            </div>

            <EventFooter :event-data="event" :channels-except-current="channelsExceptCurrent" />

            <div v-if="showComments">
              <EventRootCommentFormWrapper :key="`${eventId}`" :event="event" :previous-offset="previousOffset" />
              <div class="my-6 mb-2 ml-2 rounded-lg">
                <EventCommentsWrapper
                  :key="event?.id"
                  :loading="getEventCommentsLoading"
                  :event="event"
                  :comments="comments"
                  :reached-end-of-results="reachedEndOfResults"
                  :previous-offset="previousOffset"
                  :original-poster="originalPoster"
                  @load-more="loadMore"
                />
              </div>

              <EventChannelLinks v-if="event && event.EventChannels" class="my-4" :event-channels="event.EventChannels" :channel-id="channelId" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
/* Styles remain unchanged */
@media (prefers-color-scheme: dark) {
  #texteditor-textarea {
    @apply bg-dark text-dark;
  }
}

@media (prefers-color-scheme: light) {
  #texteditor-textarea {
    @apply bg-light text-light;
  }
}

.bg-dark {
  @apply bg-gray-700;
}

.text-dark {
  @apply text-gray-200;
}

.bg-light {
  @apply bg-white;
}

.text-light {
  @apply text-gray-700;
}

/* Override the default styles when the 'dark' or 'light' class is added to the 'body' element */
body.dark #texteditor-textarea {
  @apply text-dark bg-dark;

  .md-editor-toolbar-item:hover {
    background-color: #4a5568;
  }
}

body.light #texteditor-textarea {
  @apply text-light bg-light;
}

body.dark #texteditor {
  @apply text-dark bg-dark border-gray-700;
}

body.light #texteditor {
  @apply text-light bg-light border-gray-200;
}

.md-content .md-preview,
.md-content .md-html {
  word-break: break-word;
  width: 100%;
  font-size: 1rem;
}
.md-content .md-preview,
.md-content .md-html {
  word-break: break-word;
  width: 100%;
  padding: 0;
  margin: 0;
}
#md-editor-v3-preview {
  p,
  ul,
  ol,
  blockquote > li {
    font-size: 1rem;
    word-break: break-word;
  }
}
.md-editor-footer {
  display: none;
}
</style>
