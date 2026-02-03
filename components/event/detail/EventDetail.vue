<script lang="ts" setup>
import { computed, ref, watch, watchEffect } from 'vue';
import Tag from '@/components/TagComponent.vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_EVENT } from '@/graphQLData/event/queries';
import {
  GET_EVENT_COMMENTS,
  GET_EVENT_ROOT_COMMENT_AGGREGATE,
} from '@/graphQLData/comment/queries';
import { GET_EVENT_CHANNEL } from '@/graphQLData/mod/queries';
import type {
  Comment,
  EventChannel,
  Event as EventData,
} from '@/__generated__/graphql';
import { DateTime } from 'luxon';
import { stableRelativeTime } from '@/utils';
import 'md-editor-v3/lib/style.css';
import EventFooter from '@/components/event/detail/EventFooter.vue';
import EventHeader from '@/components/event/detail/EventHeader.vue';
import EventBody from '@/components/event/detail/EventBody.vue';
import ExpandableImage from '@/components/ExpandableImage.vue';
import EventCommentsWrapper from '@/components/event/detail/EventCommentsWrapper.vue';
import EventRootCommentFormWrapper from '@/components/event/detail/EventRootCommentFormWrapper.vue';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import EventChannelLinks from '@/components/event/detail/EventChannelLinks.vue';
import { useRoute, useHead } from 'nuxt/app';
import { modProfileNameVar } from '@/cache';
import AddToCalendarButton from '../AddToCalendarButton.vue';
import ArchivedEventInfoBanner from './ArchivedEventInfoBanner.vue';
import { getOriginalPoster } from '@/utils/originalPoster';

const formatDate = (date: string) => {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
};

const COMMENT_LIMIT = 50;

const props = defineProps({
  compactMode: {
    type: Boolean,
    default: false,
  },
  eventId: {
    type: String,
    default: '',
  },
  channelUniqueName: {
    type: String,
    default: '',
  },
  issueEventId: {
    type: String,
    required: false,
    default: '',
  },
  showAddToCalendar: {
    type: Boolean,
    default: true,
  },
  showComments: {
    type: Boolean,
    default: true,
  },
  showEventInPastBanner: {
    type: Boolean,
    default: true,
  },
  showMenuButtons: {
    type: Boolean,
    default: true,
  },
  usernameOnTop: {
    type: Boolean,
    default: false,
  },
  showTitle: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['fetchedOriginalPosterUsername']);

const route = useRoute();
const offset = ref(0);

// Instead of a computed property, make it a ref
const eventId = ref(
  props.eventId ||
    props.issueEventId ||
    (typeof route.params.eventId === 'string' ? route.params.eventId : '')
);

// Add a watcher for the route params and props
watch(
  [
    () => props.eventId,
    () => props.issueEventId,
    () => route.params.eventId,
  ],
  ([newEventIdProp, newIssueEventId, newRouteEventId]) => {
    eventId.value =
      newEventIdProp ||
      newIssueEventId ||
      (typeof newRouteEventId === 'string' ? newRouteEventId : '');
  }
);

const channelId = computed(() => {
  if (props.channelUniqueName) {
    return props.channelUniqueName;
  }
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const loggedInUserModName = computed(() => modProfileNameVar.value);

const {
  result: eventResult,
  error: eventError,
  loading: eventLoading,
  refetch: loadEvent,
  onResult: onEventResult,
} = useQuery(GET_EVENT, {
  id: eventId,
  channelUniqueName: channelId.value,
  loggedInModName: loggedInUserModName.value,
});

onEventResult(({ data }) => {
  if (data?.events?.length) {
    const author = getOriginalPoster({ Event: data.events[0] });
    if (author.username) {
      emit('fetchedOriginalPosterUsername', author.username);
    }
  }
});

const event = computed<EventData>(() => eventResult.value?.events?.[0] || null);

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

const { result: getEventChannelResult, refetch: refetchEventChannel } =
  useQuery(GET_EVENT_CHANNEL, {
    eventId: eventId,
    channelUniqueName: channelId.value,
  });

const activeEventChannel = computed<EventChannel | null>(() => {
  if (!getEventChannelResult.value) {
    return null;
  }
  if (!getEventChannelResult.value.eventChannels?.length) {
    return null;
  }
  return getEventChannelResult.value.eventChannels[0];
});

const isArchived = computed(() => {
  return activeEventChannel.value?.archived;
});

const eventChannelId = computed(() => {
  return activeEventChannel.value?.id;
});

const {
  result: getEventRootCommentAggregateResult,
  error: getEventRootCommentAggregateError,
  loading: getEventRootCommentAggregateLoading,
  refetch: loadEventRootCommentAggregate,
} = useQuery(GET_EVENT_ROOT_COMMENT_AGGREGATE, {
  eventId: eventId,
});

watch([eventId, channelId], ([newEventId, newChannelId]) => {
  if (newEventId && newChannelId !== undefined) {
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
  if (!event.value?.EventChannels) return [];
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

const originalPoster = computed(() => event.value?.Poster?.username || '');

const editedAt = computed(() => {
  if (!event.value?.updatedAt) return '';
  return `Edited ${stableRelativeTime(event.value.updatedAt)}`;
});

const eventDescriptionEditMode = ref(false);

const handleClickEditEventDescription = () => {
  eventDescriptionEditMode.value = true;
};

// Add SEO metadata for the event
watchEffect(() => {
  if (!event.value) {
    useHead({
      title: `Event Not Found${channelId.value ? ` | ${channelId.value}` : ''}`,
      description: 'The requested event could not be found.',
    });
    return;
  }

  const title = event.value.title || 'Event';
  const forumName =
    activeEventChannel.value?.Channel?.displayName || channelId.value || '';
  const description = event.value.description
    ? event.value.description.substring(0, 160) +
      (event.value.description.length > 160 ? '...' : '')
    : `${title} - Event on ${formatDate(event.value.startTime)}`;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const serverDisplayName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
  const imageUrl = event.value.coverImageURL || '';

  // Set basic SEO meta tags
  useHead({
    title: forumName
      ? `${title} | ${forumName} | ${serverDisplayName}`
      : `${title} | ${serverDisplayName}`,
    description: description,
    image: imageUrl,
    type: 'event',
  });

  // Add structured data for rich results
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: title,
          description: description,
          startDate: event.value.startTime,
          endDate: event.value.endTime,
          image: imageUrl,
          location: event.value.address
            ? {
                '@type': 'Place',
                name: event.value.address,
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: event.value.address,
                },
              }
            : {
                '@type': 'VirtualLocation',
                url:
                  event.value.virtualEventUrl ??
                  `${baseUrl}/events/list/search/${event.value.id}`,
              },
          organizer: {
            '@type': 'Person',
            name:
              event.value.Poster?.displayName ||
              event.value.Poster?.username ||
              'Anonymous',
          },
          eventStatus: event.value.canceled
            ? 'https://schema.org/EventCancelled'
            : eventIsInThePast.value
              ? 'https://schema.org/EventScheduled'
              : 'https://schema.org/EventScheduled',
          eventAttendanceMode: event.value.virtualEventUrl
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : 'https://schema.org/OfflineEventAttendanceMode',
        }),
      },
    ],
  });
});
</script>

<template>
  <div
    class="w-full space-y-4 bg-white dark:bg-gray-800 dark:text-white md:px-6"
  >
    <div class="mb-10 flex w-full justify-center rounded-lg px-2">
      <div class="w-full">
        <div class="mt-1 w-full space-y-2">
          <p v-if="eventLoading && !event" class="px-4 lg:px-10">Loading...</p>
          <ErrorBanner
            v-else-if="eventError"
            class="px-4 lg:px-10"
            :text="eventError.message"
          />
          <div
            v-else-if="!eventLoading && !event"
            class="bg-gray-50 rounded-lg border border-gray-300 p-4 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <p>
              Can't find the content that was reported. It may have been
              deleted.
            </p>
          </div>

          <div
            v-else-if="event"
            class="dark:bg-dark-700 flex flex-col gap-4"
            data-testid="event-detail-content"
          >
            <nuxt-link
              v-if="usernameOnTop"
              :to="{
                name: 'u-username',
                params: { username: event?.Poster?.username },
              }"
              class="flex items-center dark:text-white"
            >
              <AvatarComponent
                v-if="event?.Poster?.username"
                :text="event?.Poster.username"
                :src="event?.Poster.profilePicURL ?? ''"
                class="mr-2 h-6 w-6"
              />
              <UsernameWithTooltip
                v-if="event?.Poster?.username"
                :username="event?.Poster?.username"
                :src="event?.Poster.profilePicURL ?? ''"
                :display-name="event?.Poster.displayName ?? ''"
                :comment-karma="event?.Poster.commentKarma ?? 0"
                :discussion-karma="event?.Poster.discussionKarma ?? 0"
                :account-created="event?.Poster.createdAt ?? ''"
              />
              <span class="ml-1"
                >posted on {{ formatDate(event.createdAt) }}</span
              >
              <span v-if="event.updatedAt" class="mx-2">&middot;</span>
              <span v-if="event.updatedAt">{{ editedAt }}</span>
            </nuxt-link>
            <InfoBanner
              v-if="eventHasStarted"
              :text="'This event has started.'"
            />
            <ArchivedEventInfoBanner
              v-if="
                isArchived && route.name !== 'forums-forumId-issues-issueNumber'
              "
              :channel-id="channelId"
              :event-channel-id="activeEventChannel?.id || ''"
            />
            <ErrorBanner
              v-if="eventIsInThePast && showEventInPastBanner"
              class="mb-2 mt-2"
              :text="'This event is in the past.'"
            />
            <ErrorBanner
              v-if="event.canceled"
              data-testid="canceled-event-banner"
              class="my-2"
              :text="'This event is canceled.'"
            />

            <div
              v-if="showTitle || (route.name === 'map-search-eventId' && event)"
              class="dark:text-gray-100 md:flex md:items-center md:justify-between"
            >
              <div class="min-w-0 flex-1">
                <h2 class="text-wrap px-1 text-2xl font-bold sm:tracking-tight">
                  <template v-if="props.issueEventId && channelId && event">
                    <nuxt-link
                      :to="{
                        name: 'forums-forumId-events-eventId',
                        params: {
                          forumId: channelId,
                          eventId: event.id,
                        },
                      }"
                      class="text-orange-500 dark:text-orange-400"
                      rel="noopener noreferrer"
                    >
                      {{ event.title }}
                    </nuxt-link>
                  </template>
                  <template v-else>
                    {{ event.title }}
                  </template>
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
                :event-is-archived="isArchived || false"
                :event-channel-id="eventChannelId"
                @archived-successfully="refetchEventChannel"
              />
              <EventBody
                v-if="event.description"
                class="px-0"
                :event="event"
                :event-description-edit-mode="eventDescriptionEditMode"
                @handle-click-edit-event-description="
                  handleClickEditEventDescription
                "
                @close-edit-event-description="eventDescriptionEditMode = false"
              />
            </div>

            <div v-if="event.Tags?.length > 0" class="my-2 px-0 sm:px-4">
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
            <div>
              <AddToCalendarButton
                v-if="event && showAddToCalendar"
                :event="event"
                class="mt-4"
              />
            </div>
            <EventFooter
              :event-data="event"
              :channels-except-current="channelsExceptCurrent"
              :show-poster="!usernameOnTop"
            />

            <div v-if="showComments">
              <div class="my-6 mb-2 rounded-lg">
                <EventCommentsWrapper
                  :key="event?.id"
                  :loading="getEventCommentsLoading"
                  :event="event"
                  :comments="comments"
                  :reached-end-of-results="reachedEndOfResults"
                  :previous-offset="previousOffset"
                  :original-poster="originalPoster"
                  :archived="isArchived || false"
                  @load-more="loadMore"
                >
                  <EventRootCommentFormWrapper
                    v-if="event && !isArchived"
                    :key="`${eventId}`"
                    :event="event"
                    :previous-offset="previousOffset"
                  />
                </EventCommentsWrapper>
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
