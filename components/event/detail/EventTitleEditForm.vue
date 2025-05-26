<script lang="ts" setup>
  import { ref, nextTick, computed } from "vue";
  import type { Event } from "@/__generated__/graphql";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import CreateButton from "@/components/CreateButton.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import GenericButton from "@/components/GenericButton.vue";
  import TextInput from "@/components/TextInput.vue";
  import CharCounter from "@/components/CharCounter.vue";
  import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/event/mutations";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import { GET_EVENT } from "@/graphQLData/event/queries";
  import { modProfileNameVar, usernameVar } from "@/cache";
  import { EVENT_TITLE_CHAR_LIMIT } from "@/utils/constants";
  import { useRoute } from "nuxt/app";

  const route = useRoute();
  const titleEditMode = ref(false);

  const channelId = computed(() =>
    typeof route.params.forumId === "string" ? route.params.forumId : ""
  );
  const eventId = computed(() =>
    typeof route.params.eventId === "string" ? route.params.eventId : ""
  );

  const {
    result: getEventResult,
    error: getEventError,
    loading: getEventLoading,
    onResult: onGetEventResult,
  } = useQuery(GET_EVENT, {
    id: eventId,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  });

  const event = computed<Event | null>(() => {
    if (getEventLoading.value || getEventError.value) return null;
    return getEventResult.value?.events?.[0] || null;
  });

  const authorIsLoggedInUser = computed(() => event.value?.Poster?.username === usernameVar.value);

  const titleInputRef = ref(null);
  const formValues = ref({
    title: getEventResult.value?.event?.title,
  });

  onGetEventResult((result) => {
    formValues.value.title = result?.data?.events?.[0]?.title || "";
  });

  const {
    mutate: updateEvent,
    error: updateEventError,
    loading: updateEventLoading,
    onDone,
  } = useMutation(UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS, () => ({
    variables: {
      where: {
        id: eventId.value,
      },
      updateEventInput: formValues.value,
      channelConnections: [],
      channelDisconnections: [],
    },
  }));

  onDone(() => {
    titleEditMode.value = false;
  });

  const onClickEdit = () => {
    titleEditMode.value = true;
    nextTick(() => {
      if (!titleInputRef.value) return;
      (titleInputRef.value as HTMLInputElement)?.focus();
    });
  };
  const formattedDate = computed(() => {
    if (!event.value?.createdAt) return "";
    // Date should be in this format: Mar 30, 2023
    return new Date(event.value.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });
</script>

<template>
  <div class="mt-4 w-full lg:px-4">
    <div class="flex space-x-0 md:flex-row md:items-center md:justify-between md:space-x-2">
      <div
        v-if="getEventLoading"
        class="flex-1 animate-pulse bg-gray-200 dark:bg-gray-700 h-8 rounded"
      />
      <div
        v-else
        ref="eventDetail"
        class="flex-1"
      >
        <h2
          v-if="!titleEditMode"
          class="text-md text-wrap px-1 sm:tracking-tight md:text-3xl"
        >
          {{ event?.title || "[Deleted]" }}
        </h2>
        <TextInput
          v-else
          ref="titleInputRef"
          :full-width="true"
          :test-id="'title-input'"
          :value="formValues.title"
          @update="formValues.title = $event"
        />
        <CharCounter
          v-if="titleEditMode"
          :current="formValues.title?.length || 0"
          :max="EVENT_TITLE_CHAR_LIMIT"
        />
        <div class="align-items mb-2 ml-1 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <slot />
          <span class="align-items mt-0.5 flex">
            {{
              `${event?.Poster ? event.Poster.username : "[Deleted]"} posted this event on ${formattedDate}`
            }}
          </span>
        </div>
      </div>
      <RequireAuth
        class="hidden md:block"
        :full-width="false"
      >
        <template #has-auth>
          <div class="flex h-10 items-center">
            <GenericButton
              v-if="!titleEditMode && authorIsLoggedInUser"
              :text="'Edit'"
              @click="onClickEdit"
            />
            <CreateButton
              v-if="!titleEditMode"
              class="ml-2"
              :label="'New Event'"
              :to="`/forums/${channelId}/events/create`"
            />
            <PrimaryButton
              v-if="titleEditMode"
              :disabled="
                !formValues.title?.length || formValues.title?.length > EVENT_TITLE_CHAR_LIMIT
              "
              :label="'Save'"
              :loading="updateEventLoading"
              @click="updateEvent"
            />
            <GenericButton
              v-if="titleEditMode"
              class="ml-2"
              :text="'Cancel'"
              @click="titleEditMode = false"
            />
          </div>
        </template>
        <template #does-not-have-auth>
          <PrimaryButton
            class="ml-2"
            :label="'New Event'"
          />
        </template>
      </RequireAuth>
    </div>

    <ErrorBanner
      v-if="getEventError"
      class="mx-auto my-3 max-w-5xl"
      :text="getEventError.message"
    />
    <ErrorBanner
      v-if="updateEventError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateEventError.message"
    />
  </div>
</template>
