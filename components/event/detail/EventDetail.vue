<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import Tag from '@/components/TagComponent.vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetEventDocument as GET_EVENT,
  GetEventCommentsDocument as GET_EVENT_COMMENTS,
  GetEventRootCommentAggregateDocument as GET_EVENT_ROOT_COMMENT_AGGREGATE,
  GetEventChannelIdDocument as GET_EVENT_CHANNEL, GetChannelDocument as GET_CHANNEL , GetServerConfigDocument as GET_SERVER_CONFIG
} from '@/__generated__/operations';
import { DateTime } from 'luxon';
import { config } from '@/config';
import type {
  EventPresentation,
  EventRootComment,
} from '@/types/EventPresentation';
import { stableRelativeTime } from '@/utils';
import { isEventInThePast, hasEventStarted } from '@/utils/eventTiming';
import { formatEventDate, buildEventHead } from '@/utils/eventSeo';
import 'md-editor-v3/lib/style.css';
import EventFooter from '@/components/event/detail/EventFooter.vue';
import EventHeader from '@/components/event/detail/EventHeader.vue';
import EventBody from '@/components/event/detail/EventBody.vue';
import EventTitleVersions from '@/components/event/detail/activityFeed/EventTitleVersions.vue';
import EventDescriptionEditsDropdown from '@/components/event/detail/activityFeed/EventDescriptionEditsDropdown.vue';
import ExpandableImage from '@/components/ExpandableImage.vue';
import EventCommentsWrapper from '@/components/event/detail/EventCommentsWrapper.vue';
import EventRootCommentFormWrapper from '@/components/event/detail/EventRootCommentFormWrapper.vue';
import { getSortFromQuery } from '@/utils/getSortFromQuery';
import EventChannelLinks from '@/components/event/detail/EventChannelLinks.vue';
import { useRoute, useHead } from 'nuxt/app';
import { useModProfileName, useUsername } from '@/composables/useAuthState';
import { provideForumRoleMembership } from '@/composables/useForumRoleMembership';
import AddToCalendarButton from '../AddToCalendarButton.vue';
import ArchivedEventInfoBanner from './ArchivedEventInfoBanner.vue';
import { getOriginalPoster } from '@/utils/originalPoster';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();

const formatDate = formatEventDate;

// The forum shell imports EventDetail on discussion and download routes too.
// Only discovery previews need this selector, so keep it out of their preload graph.
const ForumSubmissions = defineAsyncComponent(
  () => import('@/components/discovery/ForumSubmissions.vue')
);

const COMMENT_LIMIT = 50;

const props = defineProps({
  discoveryMode: { type: Boolean, default: false },
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
  // When the title is shown in a preview (e.g. the search right pane), render
  // it as an underlined link to the event detail page so it's clear that
  // clicking it navigates away.
  linkTitle: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['fetchedOriginalPosterUsername']);

const route = useRoute();
const eventId = computed(
  () =>
    props.eventId ||
    props.issueEventId ||
    (typeof route.params.eventId === 'string' ? route.params.eventId : '')
);

const channelId = computed(() => {
  if (props.channelUniqueName) {
    return props.channelUniqueName;
  }
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

// Provide this channel's owner/moderator lists so the event header/footer can
// show membership-derived Forum Admin / Forum Mod author badges.
provideForumRoleMembership(channelId);

const loggedInUserModName = computed(() => modProfileNameVar.value);

const {
  result: eventResult,
  error: eventError,
  loading: eventLoading,
  onResult: onEventResult,
} = useQuery(
  GET_EVENT,
  () => ({
    id: eventId.value,
    channelUniqueName: channelId.value,
    loggedInModName: loggedInUserModName.value,
  }),
  {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    enabled: computed(() => !!eventId.value),
    keepPreviousResult: false,
  }
);

onEventResult(({ data, loading }) => {
  const current = data?.events?.find((item) => item.id === eventId.value);
  if (!loading && current) {
    const author = getOriginalPoster({ Event: current });
    if (author.username) {
      emit('fetchedOriginalPosterUsername', author.username);
    }
  }
});

const event = computed<EventPresentation | null>(() => {
  const loadedEvent = !eventLoading.value
    ? eventResult.value?.events?.find((item) => item.id === eventId.value)
    : null;
  const fallback = getEventCommentsResult.value?.getEventComments?.Event;
  return loadedEvent || (fallback?.id === eventId.value ? fallback : null);
});

const commentSort = computed(() => getSortFromQuery(route.query));

const {
  result: getEventCommentsResult,
  loading: getEventCommentsLoading,
  error: getEventCommentsError,
  fetchMore: fetchMoreComments,
  refetch: loadEventComments,
} = useQuery(
  GET_EVENT_COMMENTS,
  () => ({
    eventId: eventId.value,
    offset: 0,
    limit: COMMENT_LIMIT,
    sort: commentSort.value,
  }),
  {
    enabled: computed(() => !!eventId.value),
    keepPreviousResult: false,
  }
);

watch(
  () => usernameVar.value,
  (newUsername, prevUsername) => {
    if (!newUsername || newUsername === prevUsername) return;
    loadEventComments();
  }
);

const comments = computed<EventRootComment[]>(() => {
  const section = getEventCommentsResult.value?.getEventComments;
  if (getEventCommentsLoading.value || section?.Event?.id !== eventId.value)
    return [];
  return section.Comments.filter((item) => item?.id);
});

const {
  result: getEventChannelResult,
  loading: eventChannelLoading,
  error: eventChannelError,
  refetch: refetchEventChannel,
} = useQuery(
  GET_EVENT_CHANNEL,
  () => ({ eventId: eventId.value, channelUniqueName: channelId.value }),
  {
    enabled: computed(() => !!eventId.value && !!channelId.value),
    keepPreviousResult: false,
  }
);

const selectedEventChannel = computed(() =>
  event.value?.EventChannels.find(
    (channel) => channel.channelUniqueName === channelId.value
  )
);
const activeEventChannel = computed(() => {
  if (eventChannelLoading.value || eventChannelError.value) return null;
  return (
    getEventChannelResult.value?.eventChannels.find(
      (channel) => channel.id === selectedEventChannel.value?.id
    ) || null
  );
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
} = useQuery(
  GET_EVENT_ROOT_COMMENT_AGGREGATE,
  () => ({ eventId: eventId.value }),
  { enabled: computed(() => !!eventId.value), keepPreviousResult: false }
);

// Prefetch channel + server config in this first query wave. EventHeader issues
// these same queries, but it only mounts after the event loads (it sits behind
// v-if="event"), so on client-side navigation they would otherwise start a
// second request wave once the header appears. Firing them here (cache-first,
// identical variables) warms the Apollo cache so the header reads them
// instantly. Results are intentionally unused here — this is a cache-priming
// prefetch.
useQuery(
  GET_CHANNEL,
  () => ({
    uniqueName: channelId.value,
    now: DateTime.local().startOf('hour').toISO(),
  }),
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!channelId.value),
  }
);

useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const loadedRootCommentCount = computed(() => comments.value.length);

const aggregateRootCommentCount = computed(() => {
  if (
    getEventRootCommentAggregateLoading.value ||
    getEventRootCommentAggregateError.value
  )
    return 0;
  const events = getEventRootCommentAggregateResult.value?.events || [];
  return (
    events.find((item) => item.id === eventId.value)?.CommentsConnection
      ?.aggregate?.count?.nodes || 0
  );
});
const previousOffset = 0;
const paginationScope = computed(() =>
  JSON.stringify([eventId.value, channelId.value, commentSort.value])
);
const loadMore = () => {
  if (getEventCommentsLoading.value || !eventId.value) return;
  const scope = paginationScope.value;
  const id = eventId.value;
  return fetchMoreComments({
    variables: {
      eventId: id,
      sort: commentSort.value,
      offset: comments.value.length,
      limit: COMMENT_LIMIT,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      const previous = previousResult.getEventComments;
      const next = fetchMoreResult?.getEventComments;
      if (
        scope !== paginationScope.value ||
        previous?.Event?.id !== id ||
        next?.Event?.id !== id
      )
        return previousResult;
      const merged = new Map(
        previous.Comments.filter((item) => item?.id).map((item) => [
          item.id,
          item,
        ])
      );
      next.Comments.forEach((item) => {
        if (item?.id) merged.set(item.id, item);
      });
      return {
        ...previousResult,
        getEventComments: { ...previous, Comments: [...merged.values()] },
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
    (ec) => ec.channelUniqueName !== channelId.value
  );
});

const eventIsInThePast = computed(() => isEventInThePast(event.value));

const eventHasStarted = computed(() => hasEventStarted(event.value));

const displayTitle = computed(
  () =>
    props.showTitle ||
    route.name === 'map-search-eventId' ||
    route.name === 'forums-forumId-events-eventId'
);

const originalPoster = computed(() => event.value?.Poster?.username || '');

const editedAt = computed(() => {
  if (!event.value?.updatedAt) return '';
  return `Edited ${stableRelativeTime(event.value.updatedAt)}`;
});

const eventDescriptionEditMode = ref(false);
watch([eventId, channelId], () => {
  eventDescriptionEditMode.value = false;
});

const handleClickEditEventDescription = () => {
  eventDescriptionEditMode.value = true;
};

// SEO metadata: built in a computed and registered once in setup (#583).
useHead(
  computed(() =>
    buildEventHead({
      event: event.value,
      channelId: channelId.value,
      forumName:
        selectedEventChannel.value?.Channel?.displayName ||
        channelId.value ||
        '',
      serverDisplayName: config.serverDisplayName,
      baseUrl: import.meta.env.VITE_BASE_URL,
    })
  )
);
</script>

<template>
  <div class="w-full bg-white dark:bg-black dark:text-white">
    <div
      class="mx-auto flex w-full max-w-4xl justify-center rounded-lg px-4 pb-8 sm:px-6"
    >
      <div class="w-full">
        <div class="w-full">
          <p v-if="eventLoading && !event" class="px-4 lg:px-10">Loading...</p>
          <ErrorBanner
            v-else-if="eventError"
            class="px-4 lg:px-10"
            :text="eventError.message"
          />
          <div
            v-else-if="!eventLoading && !event"
            class="rounded-lg border border-gray-300 bg-gray-50 p-4 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <p>
              Can't find the content that was reported. It may have been
              deleted.
            </p>
          </div>

          <div
            v-else-if="event"
            class="dark:bg-dark-700 flex flex-col gap-5"
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
                :variant-source="event?.Poster || null"
                class="mr-2 h-6 w-6"
              />
              <UsernameWithTooltip
                v-if="event?.Poster?.username"
                :username="event?.Poster?.username"
                :src="event?.Poster.profilePicURL ?? ''"
                :variant-source="event?.Poster || null"
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
              v-if="eventIsInThePast && showEventInPastBanner && !discoveryMode"
              class="mt-2 mb-2"
              :text="'This event is in the past.'"
            />
            <p
              v-if="discoveryMode && eventIsInThePast"
              class="self-start rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              Past event
            </p>
            <ErrorBanner
              v-if="event.canceled"
              data-testid="canceled-event-banner"
              class="my-2"
              :text="'This event is canceled.'"
            />

            <div
              v-if="displayTitle"
              class="md:flex md:items-center md:justify-between dark:text-gray-100"
            >
              <div class="min-w-0 flex-1">
                <h1
                  class="leading-tight font-extrabold tracking-tight text-wrap"
                  :class="
                    compactMode || discoveryMode
                      ? 'text-2xl'
                      : 'text-2xl sm:text-3xl'
                  "
                >
                  <template v-if="props.issueEventId && channelId && event">
                    <nuxt-link
                      :to="{
                        name: 'forums-forumId-events-eventId',
                        params: {
                          forumId: channelId,
                          eventId: event.id,
                        },
                      }"
                      class="text-brand-500 dark:text-brand-400"
                      rel="noopener noreferrer"
                    >
                      {{ event.title }}
                    </nuxt-link>
                  </template>
                  <template v-else-if="linkTitle && channelId && event">
                    <nuxt-link
                      :to="{
                        name: 'forums-forumId-events-eventId',
                        params: {
                          forumId: channelId,
                          eventId: event.id,
                        },
                      }"
                      class="decoration-gray-400 underline-offset-4 hover:underline focus-visible:underline dark:decoration-gray-500"
                    >
                      {{ event.title }}
                    </nuxt-link>
                  </template>
                  <template v-else>
                    {{ event.title }}
                  </template>
                </h1>
              </div>
            </div>

            <EventTitleVersions v-if="displayTitle && event" :event="event" />

            <ExpandableImage
              v-if="event.coverImageURL"
              :src="event.coverImageURL"
              :alt="event.title"
              :full-width="true"
              class="overflow-hidden rounded-xl"
              sizes="(min-width: 1024px) 896px, 100vw"
              loading="eager"
              fetchpriority="high"
            />

            <div class="space-y-5">
              <EventHeader
                :event-data="event"
                :discovery-mode="discoveryMode"
                :show-menu-buttons="showMenuButtons"
                :event-is-archived="isArchived || false"
                :event-channel-id="eventChannelId"
                @archived-successfully="refetchEventChannel"
              />
              <EventBody
                v-if="event.description"
                :event="event"
                :event-description-edit-mode="eventDescriptionEditMode"
                @handle-click-edit-event-description="
                  handleClickEditEventDescription
                "
                @close-edit-event-description="eventDescriptionEditMode = false"
              />
              <div
                v-if="event.PastDescriptionVersions?.length"
                class="px-1 pt-1"
              >
                <EventDescriptionEditsDropdown :event="event" />
              </div>
            </div>

            <div v-if="event.Tags?.length > 0">
              <div class="flex flex-wrap gap-1.5">
                <Tag
                  v-for="tag in event.Tags"
                  :key="tag.text"
                  :tag="tag.text"
                  :event-id="eventId"
                />
              </div>
            </div>
            <div v-if="event && showAddToCalendar" class="pt-1">
              <AddToCalendarButton :event="event" />
            </div>
            <EventFooter
              :event-data="event"
              :compact-mode="compactMode || discoveryMode"
              :channels-except-current="channelsExceptCurrent"
              :show-poster="!usernameOnTop"
            />

            <div
              v-if="discoveryMode"
              class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <ForumSubmissions
                :submissions="event.EventChannels"
                :content-id="event.id"
                kind="event"
              />
            </div>
            <div v-if="showComments">
              <ErrorBanner
                v-if="getEventCommentsError"
                :text="getEventCommentsError.message"
              />
              <div class="my-6 mb-2 rounded-lg">
                <EventCommentsWrapper
                  :key="`${eventId}:${channelId}`"
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
                    :key="`${eventId}:${channelId}`"
                    :event="event"
                    :previous-offset="previousOffset"
                  />
                </EventCommentsWrapper>
              </div>
            </div>
            <EventChannelLinks
              v-if="!discoveryMode && event && event.EventChannels"
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
@reference '../../../assets/css/index.css';

@media (prefers-color-scheme: dark) {
  #texteditor-textarea {
    background-color: #374151;
    color: #e5e7eb;
  }
}

@media (prefers-color-scheme: light) {
  #texteditor-textarea {
    background-color: #f3f4f6;
    color: #374151;
  }
}

/* Override the default styles when the 'dark' or 'light' class is added to the 'body' element */
body.dark #texteditor-textarea {
  background-color: #374151;
  color: #e5e7eb;

  .md-editor-toolbar-item:hover {
    background-color: #4a5568;
  }
}

body.light #texteditor-textarea {
  background-color: #f3f4f6;
  color: #374151;
}

body.dark #texteditor {
  border-color: #374151;
  background-color: #374151;
  color: #e5e7eb;
}

body.light #texteditor {
  border-color: #e5e7eb;
  background-color: #f3f4f6;
  color: #374151;
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
