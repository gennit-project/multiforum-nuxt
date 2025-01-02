<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import Tag from "@/components/TagComponent.vue";
import { useLazyQuery, useQuery } from "@vue/apollo-composable";
import { GET_EVENT } from "@/graphQLData/event/queries";
import {
  GET_EVENT_COMMENTS,
  GET_EVENT_ROOT_COMMENT_AGGREGATE,
} from "@/graphQLData/comment/queries";
import type { Comment, EventChannel } from "@/__generated__/graphql";
import { DateTime } from "luxon";
import "md-editor-v3/lib/style.css";
import EventFooter from "@/components/event/detail/EventFooter.vue";
import EventHeader from "@/components/event/detail/EventHeader.vue";
import GenericButton from "@/components/GenericButton.vue";
import EventBody from "@/components/event/detail/EventBody.vue";
import ExpandableImage from "@/components/ExpandableImage.vue";
import EventCommentsWrapper from "@/components/event/detail/EventCommentsWrapper.vue";
import EventRootCommentFormWrapper from "@/components/event/detail/EventRootCommentFormWrapper.vue";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import EventChannelLinks from "@/components/event/detail/EventChannelLinks.vue";
import { useRoute } from "nuxt/app";
import { modProfileNameVar } from "@/cache";

const COMMENT_LIMIT = 50;

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

// Instead of a computed property, make it a ref
const eventId = ref(
  typeof route.params.eventId === "string"
    ? route.params.eventId
    : props.issueEventId || ""
);

// Add a watcher for the route params
watch(
  () => route.params.eventId,
  (newEventId) => {
    eventId.value =
      typeof newEventId === "string" ? newEventId : props.issueEventId || "";
  }
);

const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);

const loggedInUserModName = computed(() => modProfileNameVar.value);

const {
  result: eventResult,
  error: eventError,
  loading: eventLoading,
  refetch: loadEvent,
} = useQuery(GET_EVENT, {
  id: eventId,
  channelUniqueName: channelId.value,
  loggedInModName: loggedInUserModName.value,
});

const event = computed(() => eventResult.value?.events?.[0] || null);

const commentSort = computed(() => getSortFromQuery(route.query));

const {
  result: getEventCommentsResult,
  loading: getEventCommentsLoading,
  fetchMore: fetchMoreComments,
  refetch: loadEventComments,
} = useQuery(GET_EVENT_COMMENTS, {
  eventId: eventId,
  offset: offset.value,
  limit: COMMENT_LIMIT,
  sort: commentSort.value,
});

watch(commentSort, () =>
  fetchMoreComments({ variables: { sort: commentSort.value } })
);

const comments = computed<Comment[]>(
  () => getEventCommentsResult.value?.getEventComments?.Comments || []
);

const {
  result: getEventRootCommentAggregateResult,
  error: getEventRootCommentAggregateError,
  loading: getEventRootCommentAggregateLoading,
  refetch: loadEventRootCommentAggregate,
} = useQuery(GET_EVENT_ROOT_COMMENT_AGGREGATE, {
  eventId: eventId,
});

watch(eventId, (newEventId) => {
  if (newEventId) {
    loadEvent();
    loadEventComments();
    loadEventRootCommentAggregate();
  }
});

const loadedRootCommentCount = computed(() => comments.value.length);

const aggregateRootCommentCount = computed(() => {
  if (
    getEventRootCommentAggregateLoading.value ||
    getEventRootCommentAggregateError.value
  )
    return 0;
  const events = getEventRootCommentAggregateResult.value?.events || [];
  return events[0]?.CommentsAggregate?.count || 0;
});
const previousOffset = ref(0);
const loadMore = () => {
  fetchMoreComments({
    variables: {
      offset:
        getEventCommentsResult.value?.getEventComments?.Comments?.length || 0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      offset.value += fetchMoreResult.getEventComments.Comments.length;
      return {
        ...previousResult,
        getEventComments: {
          ...previousResult.getEventComments,
          Comments: [
            ...previousResult.getEventComments.Comments,
            ...fetchMoreResult.getEventComments.Comments,
          ],
        },
      };
    },
  });
};

const reachedEndOfResults = computed(
  () => loadedRootCommentCount.value >= aggregateRootCommentCount.value
);

const channelsExceptCurrent = computed(() => {
  if (!event.value) return [];
  return event.value.EventChannels.filter(
    (ec: EventChannel) => ec.channelUniqueName !== channelId.value
  );
});

const eventIsInThePast = computed(() => {
  if (!event.value) return false;
  return DateTime.fromISO(event.value.endTime) < DateTime.now();
});

const eventHasStarted = computed(() => {
  if (!event.value) return false;
  return (
    DateTime.fromISO(event.value.startTime) < DateTime.now() &&
    !eventIsInThePast.value
  );
});

const originalPoster = computed(() => event.value?.Poster?.username || "");
const addToGoogleCalendar = () => {
  const googleCalendarDateFormat = "yyyyMMdd'T'HHmmss";
  const start = DateTime.fromISO(event.value?.startTime).toFormat(
    googleCalendarDateFormat
  );
  const end = DateTime.fromISO(event.value?.endTime).toFormat(
    googleCalendarDateFormat
  );

  const baseUrl = "https://www.google.com/calendar/render";
  const location = event.value?.address
    ? encodeURIComponent(event.value?.address)
    : encodeURIComponent(event.value?.virtualEventUrl);
  const name = encodeURIComponent(event.value?.title);
  const details = encodeURIComponent(event.value?.description);

  const googleUrl = `${baseUrl}?action=TEMPLATE&text=${name}&dates=${start}/${end}&details=${details}&location=${location}`;
  window.open(googleUrl, "_blank");
};

const addToiCal = () => {
  const data = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `URL:${document.URL}`,
    `DTSTART:${event.value?.startTime.replace(/-|:|\.\d{3}/g, "")}`,
    `DTEND:${event.value?.endTime.replace(/-|:|\.\d{3}/g, "")}`,
    `SUMMARY:${event.value?.title}`,
    `DESCRIPTION:${event.value?.description}`,
    `LOCATION:${event.value?.address}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  const blob = new Blob([data], { type: "text/calendar;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "event.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const addToOutlook = () => {
  // For Outlook, you can use the same iCal method, because Outlook supports iCal files.
  // Alternatively, if you want to create a link to Outlook Calendar's web version, you would construct a URL like the Google Calendar one.
  addToiCal();
};
</script>

<template>
  <div
    class="w-full space-y-4 bg-white dark:bg-gray-800 md:px-6 dark:text-white"
  >
    <div class="mb-10 flex w-full justify-center rounded-lg">
      <div class="w-full">
        <div class="mt-1 w-full space-y-2">
          <p v-if="eventLoading && !event" class="px-4 lg:px-10">Loading...</p>
          <ErrorBanner
            v-else-if="eventError"
            class="px-4 lg:px-10"
            :text="eventError.message"
          />
          <div v-else-if="!event">Could not find the event.</div>

          <div
            v-else-if="event"
            class="dark:bg-dark-700 flex flex-col gap-4"
          >
            <InfoBanner
              v-if="eventHasStarted"
              :text="'This event has started.'"
            />
            <ErrorBanner
              v-if="eventIsInThePast"
              class="mx-4 mb-2 mt-2"
              :text="'This event is in the past.'"
            />
            <ErrorBanner
              v-if="event.canceled"
              data-testid="canceled-event-banner"
              class="my-2"
              :text="'This event is canceled.'"
            />

            <div
              v-if="route.name === 'map-search-eventId' && event"
              class="dark:text-gray-100 md:flex md:items-center md:justify-between"
            >
              <div class="min-w-0 flex-1">
                <h2 class="text-wrap px-1 text-2xl font-bold sm:tracking-tight">
                  {{ event.title }}
                </h2>
              </div>
            </div>

            <ExpandableImage
              v-if="event.coverImageURL"
              :src="event.coverImageURL"
              :alt="event.title"
            />

            <div>
              <EventHeader
                :event-data="event"
                :show-menu-buttons="showMenuButtons"
              />
              <EventBody v-if="event.description" :event="event" class="-ml-4" />

              <div >
                <h2 class="text-md mt-4">Add to Calendar</h2>
                <hr />
                <div class="mt-4 flex">
                  <div class="flex flex-row gap-2 text-sm">
                    <div class="flex justify-start">
                      <GenericButton
                        :text="'Google Calendar'"
                        data-testid="add-to-google-calendar-button"
                        @click="addToGoogleCalendar"
                      />
                    </div>
                    <div class="flex justify-center">
                      <GenericButton
                        :text="'iCal'"
                        data-testid="add-to-ical-button"
                        @click="addToiCal"
                      />
                    </div>
                    <div class="flex justify-end">
                      <GenericButton
                        :text="'Outlook'"
                        data-testid="add-to-outlook-button"
                        @click="addToOutlook"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="my-2">
              <div class="flex space-x-1">
                <Tag
                  v-for="tag in event.Tags"
                  :key="tag.text"
                  class="mt-2"
                  :tag="tag.text"
                  :event-id="eventId"
                />
              </div>
            </div>

            <EventFooter
              :event-data="event"
              :channels-except-current="channelsExceptCurrent"
            />

            <div v-if="showComments">
              <EventRootCommentFormWrapper
                :key="`${eventId}`"
                :event="event"
                :previous-offset="previousOffset"
              />
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
            </div>
            <EventChannelLinks
              v-if="event && event.EventChannels"
              class="my-4"
              :event-channels="event.EventChannels"
              :channel-id="channelId"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
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
  @apply bg-gray-100;
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
