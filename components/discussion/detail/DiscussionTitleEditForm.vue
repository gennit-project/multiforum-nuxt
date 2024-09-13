<script lang="ts" setup>
import { ref, nextTick, computed } from "vue";
import type { Discussion } from "@/__generated__/graphql";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import CreateButton from "@/components/CreateButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import TextInput from "@/components/TextInput.vue";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { useMutation, useQuery } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import gql from "graphql-tag";
import cache from "@/cache";

const route = useRoute();
const titleEditMode = ref(false);

const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);
const username = computed(() => localUsernameResult.value?.username || "");

const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const discussionId = computed(() =>
  typeof route.params.discussionId === "string" ? route.params.discussionId : ""
);

const {
  result: localModProfileNameResult,
  loading: localModProfileNameLoading,
  error: localModProfileNameError,
} = useQuery(GET_LOCAL_MOD_PROFILE_NAME);
const loggedInUserModName = computed(() =>
  !localModProfileNameLoading.value && !localModProfileNameError.value
    ? localModProfileNameResult.value?.modProfileName || ""
    : ""
);

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

const discussion = computed<Discussion | null>(() =>
  !getDiscussionLoading.value && !getDiscussionError.value
    ? getDiscussionResult.value?.discussions[0]
    : null
);
const authorIsLoggedInUser = computed(
  () => discussion.value?.Author?.username === username.value
);

const titleInputRef = ref(null);
const formValues = ref({
  title: getDiscussionResult.value?.discussion?.title || "",
});
onGetDiscussionResult(
  (result) =>
    (formValues.value.title = result?.data?.discussions[0]?.title || "")
);

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    discussionWhere: { id: discussionId.value },
    updateDiscussionInput: formValues.value,
  },
}));
onDone(() => (titleEditMode.value = false));

const theme = cache.readQuery({
  query: gql`
    query getTheme {
      theme @client
    }
  `,
})?.theme;
const onClickEdit = () => {
  titleEditMode.value = true;
  nextTick(() => {
    if (!titleEditMode.value) return;
    titleInputRef.value?.focus();
  });
};
</script>

<template>
  <div class="w-full">
    <div
      class="mb-2 w-full flex flex-col md:flex-row md:items-center md:justify-between space-y-1 md:space-x-2"
    >
      <v-skeleton-loader
        v-if="getDiscussionLoading"
        class="flex-1"
        type="text"
        :theme="theme"
      />
      <div v-else ref="discussionDetail" class="flex-1">
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
      <RequireAuth class="flex max-w-sm justify-end">
        <template #has-auth>
          <GenericButton
            v-if="!titleEditMode && authorIsLoggedInUser"
            :text="'Edit'"
            @click="onClickEdit"
          />
          <CreateButton
            v-if="!titleEditMode"
            class="ml-2"
            :to="`/forums/${channelId}/discussions/create`"
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
          <PrimaryButton class="ml-2" :label="'New Discussion'" />
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
