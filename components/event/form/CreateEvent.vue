<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import {
  useMutation,
  useQuery,
  provideApolloClient,
} from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import type { CreateEditEventFormValues } from "@/types/Event";
import CreateEditEventFields from "./CreateEditEventFields.vue";
import { CREATE_EVENT_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/event/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { apolloClient } from "@/main";
import { getTimePieces } from "@/utils/dateTimeUtils";
import { DateTime } from "luxon";
import { gql } from "@apollo/client/core";
import getDefaultEventFormValues from "./defaultEventFormValues";
import RequireAuth from "../../auth/RequireAuth.vue";
import type {
  EventCreateInput,
  EventTagsConnectOrCreateFieldInput,
  Event,
} from "@/src/__generated__/graphql";

export default defineComponent({
  name: "CreateEvent",
  components: {
    CreateEditEventFields,
    RequireAuth,
  },
  apollo: {},
  setup() {
    provideApolloClient(apolloClient);
    const now = DateTime.now();

    const route = useRoute();
    const router = useRouter();

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const channelId: string = `${
      route.params.channelId ? route.params.channelId : ""
    }`;

    const createEventDefaultValues: CreateEditEventFormValues =
      getDefaultEventFormValues(channelId);

    const formValues = ref(createEventDefaultValues);
    const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });

    const startTimePieces = ref(getTimePieces(defaultStartTimeObj));

    const eventCreateInput = computed(() => {
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

      let input: EventCreateInput = {
        /*
          Using null values by default for required fields such as the
          title prevents the empty string from being created on the back
          end if the title is not provided.
        */
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
        Tags: {
          connectOrCreate: tagConnections,
        },
        Poster: {
          connect: {
            where: {
              node: {
                username: username.value,
              },
            },
          },
        },
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
    }); // End of createEventInput

    const channelConnections = computed(() => {
      return formValues.value.selectedChannels;
    });

    const createEventLoading = ref(false);

    const {
      mutate: createEvent,
      error: createEventError,
      onDone,
    } = useMutation(CREATE_EVENT_WITH_CHANNEL_CONNECTIONS, () => {
      return {
        errorPolicy: "all",
        variables: {
          eventCreateInput: eventCreateInput.value,
          channelConnections: channelConnections.value,
        },
        update: (cache: any, result: any) => {
          const newEvent: Event =
            result.data?.createEventWithChannelConnections;

          cache.modify({
            fields: {
              events(existingEventRefs = [], fieldInfo: any) {
                if (!Array.isArray(existingEventRefs)) {
                  // Without this check, it could break
                  // when creating the first event in a channel.
                  existingEventRefs = [];
                }
                const readField = fieldInfo.readField;
                const newEventRef = cache.writeFragment({
                  data: newEvent,
                  fragment: gql`
                    fragment NewEvent on Events {
                      id
                    }
                  `,
                });

                if (
                  existingEventRefs.some(
                    (ref: any) => readField("id", ref) === newEventRef.id,
                  )
                ) {
                  return existingEventRefs;
                }
                return [newEventRef, ...existingEventRefs];
              },
            },
          });
        },
      };
    });

    onDone((response: any) => {
      const newEventId = response.data.createEventWithChannelConnections?.id;

      /*
        If the event was created in the context
        of a channel, redirect to the event detail page in
        the channel.
      */

      createEventLoading.value = false;

      if (channelId) {
        router.push({
          name: "EventDetail",
          params: {
            channelId,
            eventId: newEventId,
          },
        });
      } else {
        /*
        If the event was created in the context
        of the server-wide events page,
        redirect to the event detail page in the first
        channel that the event was submitted to.
      */
        router.push({
          name: "EventDetail",
          params: {
            channelId: formValues.value.selectedChannels[0],
            eventId: newEventId,
          },
        });
      }
    });

    return {
      channelId,
      createEvent,
      createEventError,
      createEventLoading,
      createEventInput: eventCreateInput,
      formValues,
      router,
    };
  },
  methods: {
    async submit() {
      this.createEventLoading = true;
      this.createEvent();
    },
    updateFormValues(data: CreateEditEventFormValues) {
      const existingValues = this.formValues;

      this.formValues = {
        ...existingValues,
        ...data,
      };
    },
  },
});
</script>
<template>
  <RequireAuth>
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
