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
  import InfoBanner from "@/components/InfoBanner.vue";
  import { GET_DISCUSSION, IS_DISCUSSION_ANSWERED } from "@/graphQLData/discussion/queries";
  import { DISCUSSION_TITLE_CHAR_LIMIT } from "@/utils/constants";
  import { modProfileNameVar, usernameVar } from "@/cache";
  import { useAppTheme } from "@/composables/useTheme";
  import { useRoute } from "nuxt/app";
  import CheckCircleIcon from "@/components/icons/CheckCircleIcon.vue";

  const { theme } = useAppTheme();

  const route = useRoute();
  const titleEditMode = ref(false);

  const channelId = computed(() =>
    typeof route.params.forumId === "string" ? route.params.forumId : ""
  );
  const discussionId = computed(() =>
    typeof route.params.discussionId === "string" ? route.params.discussionId : ""
  );

  const {
    result: isDiscussionAnsweredResult,
    error: isDiscussionAnsweredError,
    loading: isDiscussionAnsweredLoading,
  } = useQuery(IS_DISCUSSION_ANSWERED, {
    discussionId: discussionId.value,
    channelUniqueName: channelId.value,
  });

  const answered = computed(() => {
    if (isDiscussionAnsweredLoading.value) return false;
    if (isDiscussionAnsweredError.value) return false;
    return isDiscussionAnsweredResult.value?.discussionChannels[0]?.answered || false;
  });

  const {
    result: getDiscussionResult,
    error: getDiscussionError,
    loading: getDiscussionLoading,
    onResult: onGetDiscussionResult,
  } = useQuery(GET_DISCUSSION, {
    id: discussionId,
    loggedInModName: modProfileNameVar.value || "",
    channelUniqueName: channelId.value,
  });

  const discussion = computed<Discussion | null>(() => {
    const discussion = getDiscussionResult.value?.discussions[0];
    if (getDiscussionLoading.value && !discussion) {
      return null;
    }
    if (getDiscussionError.value) {
      return null;
    }
    return discussion || null;
  });
  const authorIsLoggedInUser = computed(
    () => discussion.value?.Author?.username === usernameVar.value
  );

  const titleInputRef = ref<HTMLElement | null>(null);
  const formValues = ref({
    title: getDiscussionResult.value?.discussion?.title || "",
  });
  onGetDiscussionResult(
    (result) => (formValues.value.title = result?.data?.discussions[0]?.title || "")
  );

  const {
    mutate: updateDiscussion,
    error: updateDiscussionError,
    loading: updateDiscussionLoading,
    onDone,
  } = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
    variables: {
      where: { id: discussionId.value },
      updateDiscussionInput: formValues.value,
    },
  }));

  onDone(() => (titleEditMode.value = false));

  const onClickEdit = () => {
    titleEditMode.value = true;
    nextTick(() => {
      if (!titleEditMode.value) return;
      titleInputRef.value?.focus();
    });
  };

  const formattedDate = computed(() => {
    if (!discussion.value?.createdAt) return "";
    // Date should be in this format: Mar 30, 2023
    return new Date(discussion.value.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });

  const isDownloadDetailPage = computed(() => {
    return (
      route.name &&
      typeof route.name === "string" &&
      route.name.includes("forums-forumId-downloads-discussionId")
    );
  });
</script>

<template>
  <div class="w-full">
    <div
      class="mb-3 mt-4 flex w-full flex-col md:flex-row md:items-center md:justify-between md:space-x-2"
    >
      <v-skeleton-loader
        v-if="getDiscussionLoading"
        class="flex-1"
        :theme="theme"
        type="text"
      />
      <div
        v-else
        ref="discussionDetail"
        class="flex-1"
      >
        <h2
          v-if="!titleEditMode"
          class="text-md text-wrap px-1 sm:tracking-tight md:text-2xl lg:text-3xl"
        >
          {{ discussion && discussion.title ? discussion.title : "Couldn't find the discussion" }}
        </h2>

        <TextInput
          v-if="titleEditMode"
          ref="titleInputRef"
          :full-width="true"
          :test-id="'title-input'"
          :value="formValues.title"
          @update="formValues.title = $event"
        />
        <CharCounter
          v-if="titleEditMode"
          :current="formValues.title?.length || 0"
          :max="DISCUSSION_TITLE_CHAR_LIMIT"
        />
        <p
          v-if="!titleEditMode"
          class="ml-1 mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <slot />
          <span
            v-if="answered"
            aria-label="This discussion has been answered"
            class="mr-1 flex items-center gap-1 rounded-full border border-green-500 bg-green-100 px-2 py-1 text-xs text-green-500 dark:border-green-400 dark:bg-green-900 dark:text-green-400"
          >
            <CheckCircleIcon class="h-4 w-4" /> Answered
          </span>
          <span class="text-gray-500 dark:text-gray-300">{{
            `${discussion?.Author ? discussion.Author.username : "[Deleted]"} started this discussion ${formattedDate ? `on ${formattedDate}` : ""} in ${channelId}`
          }}</span>
        </p>
      </div>
      <RequireAuth
        class="hidden md:block"
        :full-width="false"
      >
        <template #has-auth>
          <GenericButton
            v-if="!titleEditMode && authorIsLoggedInUser"
            :text="'Edit'"
            @click="onClickEdit"
          />
          <CreateButton
            v-if="!titleEditMode && !isDownloadDetailPage"
            class="ml-2"
            :label="'New Discussion'"
            :to="`/forums/${channelId}/discussions/create`"
          />
          <CreateButton
            v-if="!titleEditMode && isDownloadDetailPage"
            class="ml-2"
            :label="'New Upload'"
            :to="`/forums/${channelId}/discussions/create`"
          />
          <PrimaryButton
            v-if="titleEditMode"
            :disabled="
              formValues.title.length === 0 || formValues.title.length > DISCUSSION_TITLE_CHAR_LIMIT
            "
            :label="'Save'"
            :loading="updateDiscussionLoading"
            @click="updateDiscussion"
          />
          <GenericButton
            v-if="titleEditMode"
            class="ml-2"
            :text="'Cancel'"
            @click="titleEditMode = false"
          />
        </template>
        <template #does-not-have-auth>
          <PrimaryButton
            v-if="!isDownloadDetailPage"
            class="ml-2"
            :label="'New Discussion'"
          />
          <PrimaryButton
            v-else
            class="ml-2"
            :label="'New Upload'"
          />
        </template>
      </RequireAuth>
    </div>

    <ErrorBanner
      v-if="getDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="getDiscussionError.message"
    />
    <InfoBanner
      v-else-if="!getDiscussionLoading && !getDiscussionError && !discussion"
      class="mx-auto my-3 max-w-5xl"
      :text="'The discussion was deleted.'"
    />
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>
