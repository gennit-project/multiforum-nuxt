<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
  import { CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
  import { usernameVar } from "@/cache";

  const router = useRouter();
  const route = useRoute();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  // Get channel data including allowedFileTypes
  const { result: channelResult, loading: channelLoading } = useQuery(GET_CHANNEL, () => ({
    uniqueName: channelId.value,
    now: new Date().toISOString(),
  }));

  const channelData = computed(() => {
    return channelResult.value?.channels?.[0] || null;
  });

  const formValues = ref<CreateEditDiscussionFormValues>({
    title: "",
    body: "",
    selectedChannels: channelId.value ? [channelId.value] : [],
    selectedTags: [],
    linkPreviews: [],
    images: [],
  });

  const {
    mutate: createDownload,
    loading: createDownloadLoading,
    error: createDownloadError,
  } = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS);

  const updateFormValues = (newValues: Partial<CreateEditDiscussionFormValues>) => {
    formValues.value = { ...formValues.value, ...newValues };
  };

  const submitForm = async () => {
    try {
      const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
        onCreate: {
          node: { text: tag },
        },
        where: {
          node: { text: tag },
        },
      }));

      // Build downloadable files connections
      const downloadableFileConnections = (formValues.value.downloadableFiles || [])
        .filter(file => file.id) // Only connect files that have database IDs
        .map(file => ({
          where: { node: { id: file.id } }
        }));

      const discussionCreateInput = {
        title: formValues.value.title,
        body: formValues.value.body,
        hasDownload: true,
        Tags: { connectOrCreate: tagConnections },
        Author: {
          connect: {
            where: {
              node: { username: usernameVar.value },
            },
          },
        },
        ...(downloadableFileConnections.length > 0 && {
          DownloadableFiles: {
            connect: downloadableFileConnections
          }
        }),
      };

      const result = await createDownload({
        input: [
          {
            discussionCreateInput,
            channelConnections: formValues.value.selectedChannels,
          },
        ],
      });

      if (result?.data?.createDiscussionWithChannelConnections?.id) {
        router.push({
          name: "forums-forumId-downloads-discussionId",
          params: {
            forumId: channelId.value,
            discussionId: result.data.createDiscussionWithChannelConnections.id,
          },
        });
      }
    } catch (error) {
      console.error("Error creating download:", error);
    }
  };

  watch(
    () => route.params.forumId,
    (newForumId) => {
      if (typeof newForumId === "string" && newForumId !== channelId.value) {
        formValues.value.selectedChannels = [newForumId];
      }
    }
  );
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <div v-if="channelLoading">Loading channel data...</div>
    <CreateEditDiscussionFields
      v-else
      :edit-mode="false"
      :form-values="formValues"
      :create-discussion-error="createDownloadError"
      :create-discussion-loading="createDownloadLoading"
      :download-mode="true"
      :channel-data="channelData"
      @submit="submitForm"
      @update-form-values="updateFormValues"
    />
  </div>
</template>
