<script lang="ts">
import { defineComponent, ref, nextTick, computed } from "vue";
import { Event } from "@/__generated__/graphql";
import { useDisplay } from "vuetify";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import CreateButton from "@/components/CreateButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import TextInput from "@/components/forms/TextInput.vue";
import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/event/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { useRoute } from "vue-router";
import { GET_EVENT } from "@/graphQLData/event/queries";
import { GET_LOCAL_MOD_PROFILE_NAME, GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import gql from "graphql-tag";

export default defineComponent({
  name: "EventTitleEditForm",
  components: {
    CreateButton,
    ErrorBanner,
    GenericButton,
    PrimaryButton,
    RequireAuth,
    TextInput,
  },
  setup() {
    const route = useRoute();
    const { smAndDown } = useDisplay();
    const titleEditMode = ref(false);

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const eventId = computed(() => {
      if (typeof route.params.eventId === "string") {
        return route.params.eventId;
      }
      return "";
    });

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const {
      result: getEventResult,
      error: getEventError,
      loading: getEventLoading,
      onResult: onGetEventResult,
    } = useQuery(GET_EVENT, {
      id: eventId,
      loggedInModName: loggedInUserModName.value,
      channelUniqueName: channelId.value,
    });

    const event = computed<Event>(() => {
      if (getEventLoading.value || getEventError.value) {
        return null;
      }
      return getEventResult.value.events[0];
    });

    const authorIsLoggedInUser = computed(() => {
      if (event.value?.Poster?.username === username.value) {
        return true;
      }
      return false;
    });

    const titleInputRef = ref(null);

    const formValues = ref({
      title: getEventResult.value?.event?.title,
    });

    onGetEventResult((result) => {
      formValues.value.title = result?.data?.events[0]?.title || "";
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
        channelDisconnections: []
      },
    }));

    onDone(() => {
      titleEditMode.value = false;
    });

    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;
    
    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });
    
    return {
      authorIsLoggedInUser,
      channelId,
      event,
      formValues,
      getEventError,
      getEventLoading,
      smAndDown,
      theme,
      titleEditMode,
      titleInputRef,
      updateEvent,
      updateEventError,
      updateEventLoading,
    };
  },
  methods: {
    onClickEdit() {
      this.titleEditMode = true;
      nextTick(() => {
        (this.$refs.titleInputRef as any).focus();
      });
    },
  },
});
</script>

<template>
  <div class="w-full">
    <div
      class="mb-2 flex w-full space-x-2"
      :class="!smAndDown ? 'items-center justify-between' : 'flex-col'"
    >
      <v-skeleton-loader
        v-if="getEventLoading"
        class="flex-1"
        type="text"
        :theme="theme"
      />

      <div
        v-else
        ref="eventDetail"
        class="flex-1"
      >
        <h2
          v-if="!titleEditMode"
          class="text-wrap px-1 text-2xl font-medium sm:tracking-tight"
        >
          {{ event && event.title ? event.title : "[Deleted]" }}
        </h2>
        <TextInput
          v-else
          ref="titleInputRef"
          :test-id="'title-input'"
          :value="formValues.title"
          :full-width="true"
          @update="formValues.title = $event"
        />
      </div>
      <RequireAuth
        :full-width="false"
        class="flex max-w-sm justify-end"
      >
        <template #has-auth>
          <GenericButton
            v-if="!titleEditMode && authorIsLoggedInUser"
            :text="'Edit'"
            @click="onClickEdit"
          />
          <CreateButton
            v-if="!titleEditMode"
            class="ml-2"
            :to="`/channels/c/${channelId}/events/create`"
            :label="'New Event'"
          />
          <PrimaryButton
            v-if="titleEditMode"
            :label="'Save'"
            :loading="updateEventLoading"
            @click="updateEvent"
          />
          <GenericButton
            v-if="titleEditMode"
            :text="'Cancel'"
            class="ml-2"
            @click="titleEditMode = false"
          />
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
