<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import FormTitle from "@/components/FormTitle.vue";
  import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
  import { CREATE_DISCUSSION } from "@/graphQLData/discussion/mutations";
  import type { CreateEditDiscussionFormValues } from "@/types/Discussion";

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
  } = useMutation(CREATE_DISCUSSION);

  const updateFormValues = (newValues: Partial<CreateEditDiscussionFormValues>) => {
    formValues.value = { ...formValues.value, ...newValues };
  };

  const submitForm = async () => {
    try {
      const result = await createDownload({
        input: {
          title: formValues.value.title,
          body: formValues.value.body,
          selectedChannels: formValues.value.selectedChannels,
          selectedTags: formValues.value.selectedTags,
          linkPreviews: formValues.value.linkPreviews,
          images: formValues.value.images,
        },
      });

      if (result?.data?.createDiscussion?.id) {
        router.push({
          name: "forums-forumId-downloads-downloadId",
          params: {
            forumId: channelId.value,
            downloadId: result.data.createDiscussion.id,
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
      @submit="submitForm"
      @update-form-values="updateFormValues"
    />
  </div>
</template>
