<script setup lang="ts">
import { ref, computed, onMounted, defineProps, nextTick } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import TextEditor from "@/components/TextEditor.vue";
import FormRow from "@/components/FormRow.vue";
import TagPicker from "@/components/TagPicker.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import TextInput from "@/components/TextInput.vue";
import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
import ForumPicker from "@/components/channel/ForumPicker.vue";
import TailwindForm from "@/components/FormComponent.vue";
import {
  MAX_CHARS_IN_DISCUSSION_BODY,
  DISCUSSION_TITLE_CHAR_LIMIT,
} from "@/utils/constants";
import AlbumEditForm from "../detail/AlbumEditForm.vue";
import DownloadEditForm from "./DownloadEditForm.vue";
import type { Channel, Discussion } from "@/__generated__/graphql";

const props = defineProps<{
  editMode: boolean;
  downloadMode: boolean;
  createDiscussionError?: ApolloError | null;
  formValues: CreateEditDiscussionFormValues | null;
  getDiscussionError?: ApolloError | null;
  updateDiscussionError?: ApolloError | null;
  discussionLoading?: boolean;
  createDiscussionLoading?: boolean;
  updateDiscussionLoading?: boolean;
  channelData?: Channel;
  discussion?: Discussion;
}>();

defineEmits(["submit", "updateFormValues", "cancel"]);

const formTitle = computed(() => {
  // handle edit mode
  if (props.editMode) {
    if (props.downloadMode) {
      return "Edit Download";
    }
    return "Edit Discussion";
  }
  // handle create mode
  if (props.downloadMode) {
    return "Create Download";
  }
  return "Create Discussion";
});
const touched = ref(false);
const titleInputRef = ref<HTMLElement | null>(null);

const needsChanges = computed(() => {
  return !(
    props.formValues?.selectedChannels &&
    props.formValues.selectedChannels.length > 0 &&
    props.formValues?.title &&
    props.formValues?.body?.length <= MAX_CHARS_IN_DISCUSSION_BODY &&
    props.formValues?.title.length <= DISCUSSION_TITLE_CHAR_LIMIT
  );
});

const changesRequiredMessage = computed(() => {
  if (!props.formValues?.title) {
    return "A title is required.";
  } else if (props.formValues?.selectedChannels?.length === 0) {
    return "Must select at least one forum.";
  } else if (props.formValues?.body?.length > MAX_CHARS_IN_DISCUSSION_BODY) {
    return `Body cannot exceed ${MAX_CHARS_IN_DISCUSSION_BODY} characters.`;
  } else if (props.formValues?.title.length > DISCUSSION_TITLE_CHAR_LIMIT) {
    return `Title cannot exceed ${DISCUSSION_TITLE_CHAR_LIMIT} characters.`;
  }
  return "";
});

onMounted(() => {
  if (titleInputRef.value) {
    nextTick(() => {
      titleInputRef.value?.focus();
    });
  }
});
// We now handle album updates directly from AlbumEditForm
// This function is no longer needed since AlbumEditForm handles it internally
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <div class="mx-auto w-full max-w-3xl">
      <div v-if="discussionLoading && !discussion">Loading...</div>

      <TailwindForm
        v-if="formValues"
        :form-title="formTitle"
        :needs-changes="needsChanges"
        :loading="createDiscussionLoading || updateDiscussionLoading"
        :handle-cancel-in-parent="editMode"
        @input="touched = true"
        @submit="$emit('submit')"
        @cancel="$emit('cancel')"
      >
        <div v-if="getDiscussionError">
          <ErrorBanner
            v-for="(error, i) of getDiscussionError?.graphQLErrors"
            :key="i"
            :text="error.message"
          />
        </div>
        <ErrorBanner
          v-if="needsChanges && touched"
          :text="changesRequiredMessage"
        />
        <ErrorBanner
          v-if="createDiscussionError"
          :text="createDiscussionError.message"
        />
        <ErrorBanner
          v-if="updateDiscussionError"
          :text="updateDiscussionError.message"
        />
        <div class="divide-y divide-gray-200">
          <div class="mt-6 space-y-4">
            <FormRow
              :section-title="downloadMode ? 'Title' : ''"
              :required="true"
            >
              <template #content>
                <TextInput
                  ref="titleInputRef"
                  :test-id="'title-input'"
                  :value="formValues.title"
                  :placeholder="'Ask a question or share something new'"
                  :full-width="true"
                  @update="$emit('updateFormValues', { title: $event })"
                />
                <CharCounter
                  :current="formValues.title?.length || 0"
                  :max="DISCUSSION_TITLE_CHAR_LIMIT"
                />
              </template>
            </FormRow>

            <FormRow v-if="downloadMode" :section-title="'Downloadable File'">
              <template #content>
                <DownloadEditForm
                  v-if="formValues"
                  :discussion="
                    editMode && discussion
                      ? discussion
                      : ({
                          id: 'temp-id',
                          DownloadableFiles: (formValues.downloadableFiles ||
                            []) as any,
                        } as Discussion)
                  "
                  :channel-data="channelData ? { 
                    allowedFileTypes: channelData.allowedFileTypes?.filter((type): type is string => type !== null) || [],
                    FilterGroups: channelData.FilterGroups || []
                  } : undefined"
                  @close-editor="() => {}"
                  @update-form-values="
                    (downloadData) => {
                      console.log(
                        'CreateEditDiscussionFields received updateFormValues:',
                        downloadData
                      );
                      $emit('updateFormValues', {
                        downloadableFiles: downloadData.downloadableFiles,
                        downloadLabels: downloadData.downloadLabels,
                      });
                    }
                  "
                />
              </template>
            </FormRow>

            <FormRow :section-title="downloadMode ? 'Description' : ''">
              <template #content>
                <TextEditor
                  class="mb-3"
                  :test-id="'body-input'"
                  :disable-auto-focus="true"
                  :initial-value="formValues.body || ''"
                  :placeholder="'Add details'"
                  :rows="7"
                  @update="$emit('updateFormValues', { body: $event })"
                />
                <CharCounter
                  :current="formValues.body?.length || 0"
                  :max="MAX_CHARS_IN_DISCUSSION_BODY"
                />
              </template>
            </FormRow>

            <FormRow>
              <template #content>
                <AlbumEditForm
                  v-if="formValues"
                  :discussion="discussion"
                  @close-editor="() => {}"
                  @update-form-values="
                    (albumData) => {
                      console.log(
                        'CreateEditDiscussionFields received updateFormValues:',
                        albumData
                      );
                      $emit('updateFormValues', { album: albumData.album });
                    }
                  "
                />
              </template>
            </FormRow>

            <FormRow :required="true">
              <template #content>
                <ForumPicker
                  :test-id="'channel-input'"
                  :selected-channels="formValues.selectedChannels"
                  @set-selected-channels="
                    $emit('updateFormValues', { selectedChannels: $event })
                  "
                />
              </template>
            </FormRow>

            <FormRow>
              <template #content>
                <TagPicker
                  data-testid="tag-input"
                  :selected-tags="formValues.selectedTags"
                  @set-selected-tags="
                    $emit('updateFormValues', { selectedTags: $event })
                  "
                />
              </template>
            </FormRow>
          </div>
        </div>
      </TailwindForm>
    </div>
  </div>
</template>
