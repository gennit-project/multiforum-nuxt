<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { DateTime } from 'luxon';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import CreateEditEventFields from '@/components/event/form/CreateEditEventFields.vue';
import {
  CREATE_EVENT_WITH_CHANNEL_CONNECTIONS,
  CREATE_EVENT_SERIES_WITH_CHANNEL_CONNECTIONS,
} from '@/graphQLData/event/mutations';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { getTimePieces } from '@/utils';
import getDefaultEventFormValues from '@/utils/defaultEventFormValues';
import { generateOccurrences } from '@/utils/generateOccurrences';
import { expandDateRangeGroups } from '@/utils/expandDateRangeGroups';
import type { CreateEditEventFormValues, DateOccurrence } from '@/types/Event';
import type {
  CreateEventSeriesInput,
  EventCreateInput,
  EventTagsConnectOrCreateFieldInput,
  RepeatPatternInput,
  Event,
} from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { FORUM_LOCKED_MESSAGE } from '@/composables/useForumLock';

const usernameVar = useUsername();

const now = DateTime.now();
const route = useRoute();
const router = useRouter();

const channelId = computed(() =>
  route.params.forumId ? String(route.params.forumId) : ''
);
const createEventDefaultValues = getDefaultEventFormValues(channelId.value);
const formValues = ref<CreateEditEventFormValues>(createEventDefaultValues);
const defaultStartTimeObj = now.startOf('hour').plus({ hours: 1 });
const startTimePieces = ref(getTimePieces(defaultStartTimeObj));

const eventCreateInput = computed<EventCreateInput>(() => {
  const tagConnections: EventTagsConnectOrCreateFieldInput[] =
    formValues.value.selectedTags.map((tag: string) => ({
      onCreate: { node: { text: tag } },
      where: { node: { text: tag } },
    }));

  let input: EventCreateInput = {
    title: formValues.value.title || '',
    description: formValues.value.description || null,
    startTime: formValues.value.startTime || null,
    startTimeDayOfWeek: startTimePieces.value.startTimeDayOfWeek || null,
    startTimeHourOfDay: startTimePieces.value.startTimeHourOfDay || 0,
    endTime: formValues.value.endTime || null,
    canceled: false,
    cost: formValues.value.cost || '',
    free: formValues.value.free || false,
    virtualEventUrl: formValues.value.virtualEventUrl || null,
    isInPrivateResidence: formValues.value.isInPrivateResidence || null,
    isAllDay: formValues.value.isAllDay || false,
    isHostedByOP: formValues.value.isHostedByOP || false,
    coverImageURL: formValues.value.coverImageURL || null,
    Tags: { connectOrCreate: tagConnections },
    Poster: { connect: { where: { node: { username: usernameVar.value } } } },
  };

  if (formValues.value.latitude && formValues.value.longitude) {
    input = {
      ...input,
      locationName: formValues.value.locationName,
      location: {
        latitude: formValues.value.latitude,
        longitude: formValues.value.longitude,
      },
      address: formValues.value.address,
    };
  }

  return input;
});

const channelConnections = computed(() => formValues.value.selectedChannels);

// A series is created when the user picks more than a single date. The final
// occurrence list comes from the manual list ("multiple"), is generated from
// the repeat pattern ("recurring"), or is expanded from date ranges
// ("dateRange"). "single" uses the single-event mutation.
const isSeries = computed(() => formValues.value.dateMode !== 'single');

const seriesOccurrences = computed<DateOccurrence[]>(() => {
  if (formValues.value.dateMode === 'recurring' && formValues.value.repeatPattern) {
    return generateOccurrences({
      pattern: formValues.value.repeatPattern,
      startTime: formValues.value.startTime,
      endTime: formValues.value.endTime,
    });
  }
  if (formValues.value.dateMode === 'dateRange') {
    return expandDateRangeGroups(formValues.value.dateRangeGroups);
  }
  return formValues.value.occurrences ?? [];
});

const eventSeriesCreateInput = computed<CreateEventSeriesInput>(() => {
  const fv = formValues.value;
  const input: CreateEventSeriesInput = {
    title: fv.title || '',
    description: fv.description || null,
    cost: fv.cost || '',
    free: fv.free || false,
    virtualEventUrl: fv.virtualEventUrl || null,
    isInPrivateResidence: fv.isInPrivateResidence || null,
    isAllDay: fv.isAllDay || false,
    isHostedByOP: fv.isHostedByOP || false,
    coverImageURL: fv.coverImageURL || null,
    tags: fv.selectedTags,
    channelConnections: fv.selectedChannels,
    occurrences: seriesOccurrences.value.map((o) => ({
      startTime: o.startTime,
      endTime: o.endTime,
    })),
    // Only a recurring series carries a repeat pattern; "multiple" is a plain
    // list of occurrences with no pattern. The form's RepeatPattern uses the
    // same string values as the generated enum input, so the shapes line up at
    // runtime.
    repeatPattern:
      fv.dateMode === 'recurring' && fv.repeatPattern
        ? (fv.repeatPattern as unknown as RepeatPatternInput)
        : null,
  };

  if (fv.latitude && fv.longitude) {
    input.locationName = fv.locationName;
    input.latitude = fv.latitude;
    input.longitude = fv.longitude;
    input.address = fv.address;
  }

  return input;
});

const submitError = ref<string | null>(null);
const submitAttempted = ref(false);

const { result: channelResult } = useQuery(
  GET_CHANNEL,
  computed(() => ({
    uniqueName: channelId.value,
    now: DateTime.local().startOf('hour').toISO(),
  })),
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!channelId.value),
  }
);

const channelEventsEnabled = computed(() => {
  if (!channelId.value) {
    return true;
  }

  return channelResult.value?.channels?.[0]?.eventsEnabled !== false;
});

const channelPreferenceError = computed(() => {
  if (channelEventsEnabled.value) {
    return null;
  }

  return 'Cannot create an event because events are not enabled for this forum.';
});

// A locked forum blocks all content creation; reuse the channel query above
// rather than issuing a second one.
const channelLockError = computed(() =>
  channelResult.value?.channels?.[0]?.locked === true
    ? FORUM_LOCKED_MESSAGE
    : null
);

const formSubmitError = computed(() => {
  return (
    submitError.value ??
    channelLockError.value ??
    channelPreferenceError.value ??
    undefined
  );
});

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelId);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

const {
  mutate: createEvent,
  loading: createEventLoading,
  error: createEventError,
  onDone,
} = useMutation(CREATE_EVENT_WITH_CHANNEL_CONNECTIONS, {
  update(cache, result) {
    const newEvent: Event = result.data?.createEventWithChannelConnections;
    if (newEvent) {
      cache.modify({
        fields: {
          events(existingEvents = []) {
            return [newEvent, ...existingEvents];
          },
        },
      });
    }
  },
});
onDone((response) => {
  const newEventId = response.data?.createEventWithChannelConnections?.[0]?.id;
  const redirectChannelId = formValues.value.selectedChannels[0];
  if (!newEventId) {
    submitError.value =
      'Unable to create event. Please check your permissions or try again.';
    return;
  }
  router.push({
    name: 'forums-forumId-events-eventId',
    params: { forumId: redirectChannelId, eventId: newEventId },
  });
});

const {
  mutate: createEventSeries,
  loading: createEventSeriesLoading,
  error: createEventSeriesError,
  onDone: onSeriesDone,
} = useMutation(CREATE_EVENT_SERIES_WITH_CHANNEL_CONNECTIONS);

onSeriesDone((response) => {
  const series = response.data?.createEventSeriesWithChannelConnections;
  // Land the user on the first occurrence of the new series.
  const firstOccurrenceId = series?.Occurrences?.[0]?.id;
  const redirectChannelId = formValues.value.selectedChannels[0];
  if (!firstOccurrenceId) {
    submitError.value =
      'Unable to create event series. Please check your permissions or try again.';
    return;
  }
  router.push({
    name: 'forums-forumId-events-eventId',
    params: { forumId: redirectChannelId, eventId: firstOccurrenceId },
  });
});

function submit() {
  submitAttempted.value = true;
  submitError.value = null;
  if (channelLockError.value) {
    submitError.value = channelLockError.value;
    return;
  }
  if (channelPreferenceError.value) {
    submitError.value = channelPreferenceError.value;
    return;
  }
  if (!eventCreateInput.value?.title) {
    console.error('Title is required');
    return;
  }
  if (!channelConnections.value?.length) {
    console.error('Channel is required');
    return;
  }
  if (usernameVar.value === '') {
    console.error('Username is required');
    return;
  }

  if (isSeries.value) {
    if (!seriesOccurrences.value.length) {
      submitError.value =
        'Please add at least one date for this event series.';
      return;
    }
    createEventSeries({ input: eventSeriesCreateInput.value });
    return;
  }

  createEvent({
    input: [
      {
        eventCreateInput: eventCreateInput.value,
        channelConnections: channelConnections.value,
      },
    ],
  });
}

function updateFormValues(data: CreateEditEventFormValues) {
  formValues.value = { ...formValues.value, ...data };
}
</script>

<template>
  <RequireAuth :full-width="true">
    <template #has-auth>
      <CreateEditEventFields
        :create-event-error="createEventError ?? createEventSeriesError"
        :edit-mode="false"
        :form-values="formValues"
        :create-event-loading="createEventLoading || createEventSeriesLoading"
        :submit-error="formSubmitError"
        :suspension-issue-number="
          showSuspensionNotice ? suspensionIssueNumber ?? undefined : undefined
        "
        :suspension-channel-id="
          showSuspensionNotice ? suspensionChannelId ?? undefined : undefined
        "
        :suspension-until="
          showSuspensionNotice ? suspensionUntil ?? undefined : undefined
        "
        :suspension-indefinitely="
          showSuspensionNotice ? suspensionIndefinitely ?? false : false
        "
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 dark:text-white">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>
