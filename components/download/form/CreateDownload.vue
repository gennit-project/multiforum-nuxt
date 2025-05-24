<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import FormTitle from "@/components/FormTitle.vue";
  import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
  import { CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
  import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
  import { usernameVar } from "@/cache";

  const router = useRouter();
  const route = useRoute();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
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
          name: "forums-forumId-downloads-downloadId",
          params: {
            forumId: channelId.value,
            downloadId: result.data.createDiscussionWithChannelConnections.id,
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
    <FormTitle>Create Download</FormTitle>

    <CreateEditDiscussionFields
      :edit-mode="false"
      :form-values="formValues"
      :create-discussion-error="createDownloadError"
      :create-discussion-loading="createDownloadLoading"
      :download-mode="true"
      @submit="submitForm"
      @update-form-values="updateFormValues"
    />
  </div>
</template>
