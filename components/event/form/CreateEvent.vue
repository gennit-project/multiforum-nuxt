<script lang="ts" setup>
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import { DateTime } from "luxon";
import { gql } from "@apollo/client/core";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import CreateEditEventFields from "@/components/event/form/CreateEditEventFields.vue";
import { CREATE_EVENT_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/event/mutations";
import { getTimePieces } from "@/utils";
import getDefaultEventFormValues from "@/utils/defaultEventFormValues";
import type { CreateEditEventFormValues } from "@/types/Event";
import type { EventCreateInput, EventTagsConnectOrCreateFieldInput, Event } from "@/__generated__/graphql";
import { usernameVar } from "@/cache";

const now = DateTime.now();
const route = useRoute();
const router = useRouter();

const username = computed(() => usernameVar() || "");

const channelId = computed(() => (route.params.forumId ? String(route.params.forumId) : ""));
const createEventDefaultValues = getDefaultEventFormValues(channelId.value);
const formValues = ref<CreateEditEventFormValues>(createEventDefaultValues);
const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });
const startTimePieces = ref(getTimePieces(defaultStartTimeObj));

const eventCreateInput = computed<EventCreateInput>(() => {
  const tagConnections: EventTagsConnectOrCreateFieldInput[] = formValues.value.selectedTags.map(tag => ({
    onCreate: { node: { text: tag } },
    where: { node: { text: tag } },
  }));

  let input: EventCreateInput = {
    title: formValues.value.title || "",
    description: formValues.value.description || null,
    startTime: formValues.value.startTime || null,
    startTimeDayOfWeek: startTimePieces.value.startTimeDayOfWeek || null,
    startTimeHourOfDay: startTimePieces.value.startTimeHourOfDay || 0,
    endTime: formValues.value.endTime || null,
    canceled: false,
    cost: formValues.value.cost || "",
    free: formValues.value.free || false,
    virtualEventUrl: formValues.value.virtualEventUrl || null,
    isInPrivateResidence: formValues.value.isInPrivateResidence || null,
    isAllDay: formValues.value.isAllDay || false,
    isHostedByOP: formValues.value.isHostedByOP || false,
    coverImageURL: formValues.value.coverImageURL || null,
    Tags: { connectOrCreate: tagConnections },
    Poster: { connect: { where: { node: { username: username.value } } } },
  };

  if (formValues.value.latitude && formValues.value.longitude) {
    input = {
      ...input,
      locationName: formValues.value.locationName,
      location: { latitude: formValues.value.latitude, longitude: formValues.value.longitude },
      address: formValues.value.address,
    };
  }

  return input;
});

const channelConnections = computed(() => formValues.value.selectedChannels);

const createEventLoading = ref(false);
const { mutate: createEvent, error: createEventError, onDone } = useMutation(CREATE_EVENT_WITH_CHANNEL_CONNECTIONS, {
  update(cache, result) {
    const newEvent: Event = result.data?.createEventWithChannelConnections;
    cache.modify({
      fields: {
        events(existingEventRefs = []) {
          const newEventRef = cache.writeFragment({
            data: newEvent,
            fragment: gql`
              fragment NewEvent on Events {
                id
              }
            `,
          });
          return [newEventRef, ...existingEventRefs];
        },
      },
    });
  },
});

onDone(response => {
  createEventLoading.value = false;
  const newEventId = response.data.createEventWithChannelConnections?.id;
  const redirectChannelId = channelId.value || formValues.value.selectedChannels[0];
  router.push({ name: "forums-forumId-events-eventId", params: { forumId: redirectChannelId, eventId: newEventId } });
});

function submit() {
  createEventLoading.value = true;
  if (!eventCreateInput.value?.title) {
    console.error("Title is required");
    return
  }
  if (!channelConnections.value?.length) {
    console.error("Channel is required");
    return
  }
  if (username.value === "") {
    console.error("Username is required");
    return
  }
  createEvent({
    eventCreateInput: eventCreateInput.value,
    channelConnections: channelConnections.value,
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
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>
