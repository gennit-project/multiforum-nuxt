<script setup lang="ts">
  import { ref, computed, watch } from "vue";
  import type { UserData } from "@/types/User";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { UPDATE_CHANNEL } from "@/graphQLData/channel/mutations";
  import type { CreateEditChannelFormValues } from "@/types/Channel";
  import CreateEditChannelFields from "@/components/channel/form/CreateEditChannelFields.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import Notification from "@/components/NotificationComponent.vue";
  import { usernameVar } from "@/cache";
  import type { Tag as TagData } from "@/__generated__/graphql";
  import { useRoute } from "nuxt/app";
  import { useQuery, useMutation } from "@vue/apollo-composable";

  const route = useRoute();
  const channelId = route.params.forumId as string;

  const {
    result: getChannelResult,
    loading: getChannelLoading,
    error: getChannelError,
  } = useQuery(GET_CHANNEL, {
    uniqueName: channelId,
    errorPolicy: "all",
  });

  const formValues = ref<CreateEditChannelFormValues>({
    uniqueName: "",
    displayName: "",
    description: "",
    selectedTags: [],
    rules: [],
    channelIconURL: "",
    channelBannerURL: "",
    wikiEnabled: false,
  });

  const dataLoaded = ref(false);

  const channel = computed(() => getChannelResult.value?.channels[0]);

  watch(
    getChannelResult,
    (newVal) => {
      if (newVal && !getChannelLoading.value && !getChannelError.value) {
        const channelData = newVal.channels[0];
        let rules = [];

        try {
          rules = JSON.parse(channelData.rules) || [];
        } catch (e) {
          console.error("Error parsing channel rules", e);
        }

        formValues.value = {
          uniqueName: channelData.uniqueName,
          description: channelData.description,
          displayName: channelData.displayName,
          selectedTags: channelData.Tags.map((tag: TagData) => tag.text),
          channelIconURL: channelData.channelIconURL,
          channelBannerURL: channelData.channelBannerURL,
          wikiEnabled: channelData.wikiEnabled,
          rules,
        };

        dataLoaded.value = true;
      }
    },
    { immediate: true }
  );

  const existingTags = computed(() => {
    return channel.value?.Tags?.map((tag: TagData) => tag.text) || [];
  });

  const ownerList = computed(() => {
    return channel.value?.Admins?.map((admin: UserData) => admin.username) || [];
  });

  const channelUpdateInput = computed(() => {
    const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
      onCreate: { node: { text: tag } },
      where: { node: { text: tag } },
    }));

    const tagDisconnections = existingTags.value
      .filter((tag: string) => !formValues.value.selectedTags.includes(tag))
      .map((tag: TagData) => ({
        where: { node: { text: tag } },
      }));

    return {
      description: formValues.value.description,
      displayName: formValues.value.displayName,
      channelIconURL: formValues.value.channelIconURL,
      channelBannerURL: formValues.value.channelBannerURL,
      rules: JSON.stringify(formValues.value.rules),
      wikiEnabled: formValues.value.wikiEnabled,
      Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
      Admins: [{ connect: [{ where: { node: { username: usernameVar.value } } }] }],
    };
  });

  const showSavedChangesNotification = ref(false);
  const {
    mutate: updateChannel,
    loading: editChannelLoading,
    error: updateChannelError,
    onDone,
  } = useMutation(UPDATE_CHANNEL);

  onDone(() => {
    showSavedChangesNotification.value = true;
  });

  function submit() {
    updateChannel({
      where: { uniqueName: channelId },
      update: channelUpdateInput.value,
    });
  }

  function updateFormValues(data: CreateEditChannelFormValues) {
    formValues.value = { ...formValues.value, ...data };
  }

  const hasError = computed(() => {
    return !!getChannelError.value || !!updateChannelError.value;
  });
</script>

<template>
  <div
    :key="$route.fullPath"
    class="px-2 md:px-8"
  >
    <RequireAuth
      :loading="!dataLoaded || getChannelLoading"
      :owners="ownerList"
      :require-ownership="true"
    >
      <template #has-auth>
        <div
          v-if="hasError"
          class="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-800 dark:text-red-200"
        >
          <p>Sorry, there was an error loading the forum data. Please try again later.</p>
          <p class="mt-2 text-sm">{{ getChannelError?.message || updateChannelError?.message }}</p>
        </div>

        <CreateEditChannelFields
          v-if="!hasError"
          :key="dataLoaded.toString()"
          :channel-loading="getChannelLoading"
          :edit-channel-loading="editChannelLoading"
          :edit-mode="true"
          :form-values="formValues"
          :get-channel-error="getChannelError"
          :owner-list="ownerList"
          :update-channel-error="updateChannelError"
          @submit="submit"
          @update-form-values="updateFormValues"
        />
        <Notification
          v-if="showSavedChangesNotification"
          title="Your changes have been saved."
          @close-notification="showSavedChangesNotification = false"
        />
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">You don't have permission to see this page.</div>
      </template>
    </RequireAuth>
  </div>
</template>
