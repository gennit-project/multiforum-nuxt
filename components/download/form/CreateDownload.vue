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
    onDone,
  } = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS);

  onDone((response) => {
    console.log("CreateDownload onDone response:", response);
    console.log("Full response.data:", response.data);
    console.log("createDiscussionWithChannelConnections:", response.data?.createDiscussionWithChannelConnections);
    
    // Try both possible response structures
    const directId = response.data?.createDiscussionWithChannelConnections?.id;
    const arrayId = response.data?.createDiscussionWithChannelConnections?.[0]?.DiscussionChannels?.[0]?.Discussion?.id;
    
    const newDiscussionId = directId || arrayId;
    console.log("Extracted discussionId:", newDiscussionId);
    
    if (newDiscussionId) {
      console.log("Navigating to download detail page:", {
        forumId: channelId.value,
        discussionId: newDiscussionId,
      });
      router.push({
        name: "forums-forumId-downloads-discussionId",
        params: {
          forumId: channelId.value,
          discussionId: newDiscussionId,
        },
      });
    } else {
      console.error("No discussionId found in response");
    }
  });

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

      await createDownload({
        input: [
          {
            discussionCreateInput,
            channelConnections: formValues.value.selectedChannels,
          },
        ],
      });

      // Navigation is now handled in the onDone hook
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
