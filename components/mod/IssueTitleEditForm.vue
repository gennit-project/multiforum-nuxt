<script lang="ts" setup>
  import { ref, nextTick, computed } from "vue";
  import type { Issue } from "@/__generated__/graphql";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import CreateButton from "@/components/CreateButton.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import GenericButton from "@/components/GenericButton.vue";
  import TextInput from "@/components/TextInput.vue";
  import { UPDATE_ISSUE } from "@/graphQLData/issue/mutations";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import { GET_ISSUE } from "@/graphQLData/issue/queries";
  import { DISCUSSION_TITLE_CHAR_LIMIT } from "@/utils/constants";
  import { modProfileNameVar } from "@/cache";
  import { useTheme } from "@/composables/useTheme";
  import { useRoute } from "nuxt/app";
  import IssueBadge from "@/components/mod/IssueBadge.vue";

  const { theme } = useTheme();

  const route = useRoute();
  const titleEditMode = ref(false);

  const channelId = computed(() =>
    typeof route.params.forumId === "string" ? route.params.forumId : ""
  );
  const issueId = computed(() =>
    typeof route.params.issueId === "string" ? route.params.issueId : ""
  );

  const {
    result: getIssueResult,
    error: getIssueError,
    loading: getIssueLoading,
    onResult: onGetIssueResult,
  } = useQuery(GET_ISSUE, {
    id: issueId,
    loggedInModName: modProfileNameVar.value || "",
    channelUniqueName: channelId.value,
  });

  const issue = computed<Issue | null>(() => {
    const issue = getIssueResult.value?.issues[0];
    if (getIssueLoading.value && !issue) {
      return null;
    }
    if (getIssueError.value) {
      return null;
    }
    return issue || null;
  });
  const authorIsLoggedInUser = computed(
    () => issue.value?.Author?.displayName === modProfileNameVar.value
  );

  const titleInputRef = ref<HTMLElement | null>(null);
  const formValues = ref({
    title: getIssueResult.value?.issue?.title || "",
  });
  onGetIssueResult((result) => (formValues.value.title = result?.data?.issues[0]?.title || ""));

  const {
    mutate: updateIssue,
    error: updateIssueError,
    loading: updateIssueLoading,
    onDone,
  } = useMutation(UPDATE_ISSUE, () => ({
    variables: {
      issueWhere: { id: issueId.value },
      updateIssueInput: formValues.value,
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
    if (!issue.value?.createdAt) return "";
    // Date should be in this format: Mar 30, 2023
    return new Date(issue.value.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });
</script>

<template>
  <div class="w-full">
    <div
      class="mb-3 mt-3 flex w-full flex-col md:flex-row md:items-center md:justify-between md:space-x-2"
    >
      <v-skeleton-loader
        v-if="getIssueLoading"
        class="flex-1"
        :theme="theme"
        type="text"
      />
      <div
        v-else
        ref="issueDetail"
        class="flex-1"
      >
        <slot />
        <h2
          v-if="!titleEditMode"
          class="text-md text-wrap px-1 sm:tracking-tight md:text-4xl"
        >
          {{ issue && issue.title ? issue.title : "Couldn't find the issue" }}
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
        <div
          v-if="!titleEditMode"
          class="mt-1 flex items-center gap-2"
        >
          <IssueBadge
            v-if="issue"
            :key="`${issue?.id}+${issue?.isOpen}`"
            :issue="issue"
          />
          <div
            v-if="issue"
            class="ml-1 mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {{
              `First reported on ${formattedDate} by ${issue?.Author?.displayName || "[Deleted]"}`
            }}
          </div>
        </div>
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
            v-if="!titleEditMode"
            class="ml-2"
            :label="'New Issue'"
            :to="`/forums/${channelId}/issues/create`"
          />
          <PrimaryButton
            v-if="titleEditMode"
            :disabled="
              formValues.title.length === 0 || formValues.title.length > DISCUSSION_TITLE_CHAR_LIMIT
            "
            :label="'Save'"
            :loading="updateIssueLoading"
            @click="updateIssue"
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
            class="ml-2"
            :label="'New Issue'"
          />
        </template>
      </RequireAuth>
    </div>

    <ErrorBanner
      v-if="getIssueError"
      class="mx-auto my-3 max-w-5xl"
      :text="getIssueError.message"
    />
    <ErrorBanner
      v-if="updateIssueError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateIssueError.message"
    />
  </div>
</template>
