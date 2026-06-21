<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { DateTime } from 'luxon';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import CreateEditEventFields from '@/components/event/form/CreateEditEventFields.vue';
import { CREATE_EVENT_WITH_CHANNEL_CONNECTIONS } from '@/graphQLData/event/mutations';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { getTimePieces } from '@/utils';
import getDefaultEventFormValues from '@/utils/defaultEventFormValues';
import type { CreateEditEventFormValues } from '@/types/Event';
import type {
  EventCreateInput,
  EventTagsConnectOrCreateFieldInput,
  Event,
} from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';

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

const createEventLoading = ref(false);
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

const formSubmitError = computed(() => {
  return submitError.value ?? channelPreferenceError.value ?? undefined;
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
  createEventLoading.value = false;
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

function submit() {
  submitAttempted.value = true;
  submitError.value = null;
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

  createEventLoading.value = true;
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
        :create-event-error="createEventError"
        :edit-mode="false"
        :form-values="formValues"
        :create-event-loading="createEventLoading"
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
