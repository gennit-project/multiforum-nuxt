<script setup lang="ts">
import { ref, computed } from 'vue';
import { GET_EVENT } from '@/graphQLData/event/queries';
import {
  UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS,
  UPDATE_EVENT_IN_SERIES,
} from '@/graphQLData/event/mutations';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import type { CreateEditEventFormValues } from '@/types/Event';
import { DateTime } from 'luxon';
import getDefaultEventFormValues from '@/utils/defaultEventFormValues';
import EditScopeModal from '@/components/event/form/EditScopeModal.vue';
import CreateEditEventFields from '@/components/event/form/CreateEditEventFields.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import type { EventEditScope } from '@/components/event/form/EditScopeModal.vue';
import type {
  EventChannel,
  EventUpdateInput,
  EventTagsConnectOrCreateFieldInput,
  EventTagsDisconnectFieldInput,
  Event,
  Tag as TagData,
} from '@/__generated__/graphql';
import { modProfileNameVar } from '@/cache';

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const eventId = route.params.eventId as string;

const dataLoaded = ref(false);
const loggedInUserModName = computed(() => modProfileNameVar.value);

const {
  result: getEventResult,
  loading: getEventLoading,
  error: getEventError,
  onResult: onGetEventResult,
} = useQuery(GET_EVENT, {
  id: eventId,
  channelUniqueName: channelId.value,
  loggedInModName: loggedInUserModName.value,
});

const event = computed(() => {
  if (getEventError.value || getEventLoading.value) {
    return null;
  }
  return getEventResult.value.events[0];
});

const ownerList = computed(() => {
  if (event.value && event.value.Poster) {
    return [event.value.Poster.username];
  }
  return [];
});

// Remember the existing tags so that if the user removes
// one or more tags, we will know to manually disconnect
// the nodes in the async call when the post is updated.
const existingTags = computed(() => {
  if (getEventError.value || getEventLoading.value || !event.value?.Tags) {
    return [];
  }
  return event.value.Tags.map((tag: TagData) => {
    return tag.text;
  });
});

const existingChannels = computed(() => {
  if (
    getEventError.value ||
    getEventLoading.value ||
    !event.value?.EventChannels
  ) {
    return [];
  }
  return event.value.EventChannels.map((ec: EventChannel) => {
    return ec.channelUniqueName;
  });
});

// Check if the event is part of a series
const isPartOfSeries = computed(() => {
  return Boolean((event.value as any)?.EventSeries?.id);
});

// Edit scope modal state
const showEditScopeModal = ref(false);

function getFormValuesFromEventData(
  eventData: Event
): CreateEditEventFormValues {
  return {
    title: eventData.title,
    description: eventData.description || '',
    selectedTags: (eventData.Tags || []).map((tag: TagData) => {
      return tag.text;
    }),
    selectedChannels: (eventData.EventChannels || []).map(
      (ec: EventChannel) => {
        return ec.channelUniqueName;
      }
    ),
    address: eventData.address || '',
    locationName: eventData.locationName || '',
    isInPrivateResidence: eventData.isInPrivateResidence || false,
    virtualEventUrl: eventData.virtualEventUrl || '',
    startTime: eventData.startTime,
    startTimeDayOfWeek: eventData.startTimeDayOfWeek || '',
    startTimeHourOfDay: eventData.startTimeHourOfDay || 0,
    endTime: eventData.endTime,
    canceled: eventData.canceled,
    deleted: eventData.deleted || false,
    cost: eventData.cost || '',
    free: eventData.free || false,
    isHostedByOP: eventData.isHostedByOP || false,
    isAllDay: eventData.isAllDay || false,
    coverImageURL: eventData.coverImageURL || '',
    // Multi-date / recurring event fields
    dateMode: 'single',
    occurrences: [],
    dateRangeGroups: [],
    repeatPattern: undefined,
  };
}

function getDefaultFormValues(): CreateEditEventFormValues {
  // If the event data is already loaded, start with
  // the existing values. This will be used if you load the page,
  // navigate away and come back.
  if (event.value) {
    return getFormValuesFromEventData(event.value);
  }
  // If the event data is loading, start with empty values. These
  // will be overwritten by onGetEventResult function when the event
  // data is loaded.
  return getDefaultEventFormValues(channelId.value);
}

const formValues = ref<CreateEditEventFormValues>(getDefaultFormValues());

onGetEventResult((value) => {
  if (value.loading) return;

  const eventData = value.data.events[0];

  formValues.value = getFormValuesFromEventData(eventData);
  dataLoaded.value = true;
});

const channelConnections = computed(() => {
  return formValues.value.selectedChannels;
});

const channelDisconnections = computed(() => {
  return existingChannels.value.filter((channel: string) => {
    return !formValues.value.selectedChannels.includes(channel);
  });
});

const updateEventInput = computed<EventUpdateInput>(() => {
  const tagConnections: EventTagsConnectOrCreateFieldInput[] =
    formValues.value.selectedTags.map((tag: string) => {
      return {
        onCreate: {
          node: {
            text: tag,
          },
        },
        where: {
          node: {
            text: tag,
          },
        },
      };
    });

  const tagDisconnections: EventTagsDisconnectFieldInput[] =
    existingTags.value
      .filter((tag: string) => {
        return !formValues.value.selectedTags.includes(tag);
      })
      .map((tag: string) => {
        return {
          where: {
            node: {
              text: tag,
            },
          },
        };
      });

  const getStartTimePieces = () => {
    const startTimeObj = DateTime.fromISO(formValues.value.startTime);
    const { weekday, hour } = startTimeObj;

    return {
      startTimeDayOfWeek: weekday.toString(),
      startTimeHourOfDay: hour,
    };
  };

  const startTimePieces = getStartTimePieces();

  let input: EventUpdateInput = {
    /*
      Using null values by default for required fields such as the
      title prevents the empty string from being created on the back
      end if the title is not provided.
    */
    title: formValues.value.title || null,
    description: formValues.value.description || null,
    startTime: formValues.value.startTime || null,
    startTimeDayOfWeek: startTimePieces.startTimeDayOfWeek || null,
    startTimeHourOfDay: startTimePieces.startTimeHourOfDay,
    endTime: formValues.value.endTime || null,
    canceled: formValues.value.canceled,
    cost: formValues.value.cost,
    free: formValues.value.free,
    virtualEventUrl: formValues.value.virtualEventUrl || null,
    isInPrivateResidence: formValues.value.isInPrivateResidence || null,
    isHostedByOP: formValues.value.isHostedByOP || false,
    isAllDay: formValues.value.isAllDay || false,
    coverImageURL: formValues.value.coverImageURL || null,
    Tags: [
      {
        connectOrCreate: tagConnections,
        disconnect: tagDisconnections,
      },
    ],
  };

  if (formValues.value.latitude && formValues.value.longitude) {
    const locationValues = {
      locationName: formValues.value.locationName,
      location: {
        latitude: formValues.value.latitude,
        longitude: formValues.value.longitude,
      },
      address: formValues.value.address,
    };
    input = { ...input, ...locationValues };
  }

  return input;
}); // End of updateEventInput

const {
  mutate: updateEvent,
  error: updateEventError,
  loading: updateEventLoading,
  onDone,
} = useMutation(UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS);

const {
  mutate: updateEventInSeries,
  error: updateEventInSeriesError,
  loading: updateEventInSeriesLoading,
  onDone: onUpdateEventInSeriesDone,
} = useMutation(UPDATE_EVENT_IN_SERIES);

// Combined error for display
const combinedUpdateError = computed(() => {
  return updateEventError.value || updateEventInSeriesError.value;
});

// Combined loading state
const combinedUpdateLoading = computed(() => {
  return updateEventLoading.value || updateEventInSeriesLoading.value;
});

const redirectToEventDetail = () => {
  router.push({
    name: 'forums-forumId-events-eventId',
    params: {
      forumId: formValues.value.selectedChannels[0],
      eventId,
    },
  });
};

onDone(() => {
  if (!updateEventError.value) {
    redirectToEventDetail();
  }
});

onUpdateEventInSeriesDone(() => {
  if (!updateEventInSeriesError.value) {
    redirectToEventDetail();
  }
});

function submit() {
  // If the event is part of a series, show the scope modal
  if (isPartOfSeries.value) {
    showEditScopeModal.value = true;
    return;
  }

  // Otherwise, update the single event directly
  const variables = {
    updateEventInput: updateEventInput.value,
    channelConnections: channelConnections.value,
    channelDisconnections: channelDisconnections.value,
    where: {
      id: eventId,
    },
  };
  updateEvent(variables);
}

function handleEditScopeConfirm(scope: EventEditScope) {
  showEditScopeModal.value = false;

  const variables = {
    eventId,
    scope,
    eventUpdateInput: updateEventInput.value,
    channelConnections: channelConnections.value,
    channelDisconnections: channelDisconnections.value,
  };

  updateEventInSeries(variables);
}

function handleEditScopeClose() {
  showEditScopeModal.value = false;
}

function updateFormValues(data: CreateEditEventFormValues) {
  // Update all form values at once because it makes cleaner
  // code than passing each form individual value as a prop to
  // CreateEditEventFields or writing separate methods to update each value.
  const existingValues = formValues.value;
  formValues.value = {
    ...existingValues,
    ...data,
  };
}
</script>
<template>
  <RequireAuth
    :require-ownership="true"
    :owners="ownerList"
    :loading="getEventLoading"
  >
    <template #has-auth>
      <CreateEditEventFields
        :key="dataLoaded.toString()"
        :edit-mode="true"
        :event-loading="getEventLoading"
        :update-event-loading="combinedUpdateLoading"
        :get-event-error="getEventError"
        :update-event-error="combinedUpdateError"
        :form-values="formValues"
        @submit="submit"
        @update-form-values="updateFormValues"
      />

      <!-- Edit scope modal for series events -->
      <EditScopeModal
        :is-open="showEditScopeModal"
        :event-title="formValues.title"
        @confirm="handleEditScopeConfirm"
        @close="handleEditScopeClose"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 dark:text-white">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>
