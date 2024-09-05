<script lang="ts">
import { defineComponent, ref, nextTick, computed } from "vue";
import type { Discussion } from "@/__generated__/graphql";
import { useDisplay } from "vuetify";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import CreateButton from "@/components/CreateButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import TextInput from "@/components/TextInput.vue";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { useRoute } from "vue-router";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import { GET_LOCAL_MOD_PROFILE_NAME, GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import gql from "graphql-tag";

export default defineComponent({
  name: "DiscussionTitleEditForm",
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
      const username = localUsernameResult.value?.username;
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

    const discussionId = computed(() => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
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
      result: getDiscussionResult,
      error: getDiscussionError,
      loading: getDiscussionLoading,
      onResult: onGetDiscussionResult,
    } = useQuery(GET_DISCUSSION, {
      id: discussionId,
      loggedInModName: loggedInUserModName.value,
      channelUniqueName: channelId.value,
    });

    const discussion = computed<Discussion>(() => {
      if (getDiscussionLoading.value || getDiscussionError.value) {
        return null;
      }
      return getDiscussionResult.value.discussions[0];
    });

    const authorIsLoggedInUser = computed(() => {
      if (discussion.value?.Author?.username === username.value) {
        return true;
      }
      return false;
    });

    const titleInputRef = ref(null);

    const formValues = ref({
      title: getDiscussionResult.value?.discussion?.title,
    });

    onGetDiscussionResult((result) => {
      formValues.value.title = result?.data?.discussions[0]?.title || "";
    });

    const {
      mutate: updateDiscussion,
      error: updateDiscussionError,
      loading: updateDiscussionLoading,
      onDone,
    } = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
      variables: {
        discussionWhere: {
          id: discussionId.value,
        },
        updateDiscussionInput: formValues.value,
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
      discussion,
      formValues,
      getDiscussionError,
      getDiscussionLoading,
      smAndDown,
      theme,
      titleEditMode,
      titleInputRef,
      updateDiscussion,
      updateDiscussionError,
      updateDiscussionLoading,
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
      class="mb-2 flex w-full space-x-2 space-y-1"
      :class="!smAndDown ? 'items-center justify-between' : 'flex-col'"
    >
      <v-skeleton-loader
        v-if="getDiscussionLoading"
        class="flex-1"
        type="text"
        :theme="theme"
      />

      <div
        v-else
        ref="discussionDetail"
        class="flex-1"
      >
        <h2
          v-if="!titleEditMode"
          class="text-wrap px-1 text-xl md:text-2xl font-medium sm:tracking-tight"
        >
          {{ discussion && discussion.title ? discussion.title : "[Deleted]" }}
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
            :to="`/forums/f/${channelId}/discussions/create`"
            :label="'New Discussion'"
          />
          <PrimaryButton
            v-if="titleEditMode"
            :label="'Save'"
            :loading="updateDiscussionLoading"
            @click="updateDiscussion"
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
            :label="'New Discussion'"
          />
        </template>
      </RequireAuth>
    </div>
    <ErrorBanner
      v-if="getDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="getDiscussionError.message"
    />
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>
