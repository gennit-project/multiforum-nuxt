<script setup lang="ts">
import { ref, computed, onMounted, defineProps } from "vue";
import type { ApolloError } from "@apollo/client/errors";
import TextEditor from "@/components/forms/TextEditor.vue";
import FormRow from "@/components/forms/FormRow.vue";
import Form from "@/components/forms/Form.vue";
import TagPicker from "@/components/forms/TagPicker.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import TextInput from "@/components/forms/TextInput.vue";
import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
import ForumPicker from "@/components/channel/ForumPicker.vue";

// Props
const props = defineProps<{
  editMode: boolean;
  createDiscussionError: ApolloError | null;
  formValues: CreateEditDiscussionFormValues | null;
  getDiscussionError: ApolloError | null;
  updateDiscussionError: ApolloError | null;
  discussionLoading: boolean;
  createDiscussionLoading: boolean;
  updateDiscussionLoading: boolean;
}>();

// Setup reactive variables
const formTitle = computed(() => props.editMode ? "Edit Discussion" : "Start Discussion");
const touched = ref(false);
const titleInputRef = ref<HTMLElement | null>(null);

// Computed properties
const needsChanges = computed(() => {
  return !(props.formValues?.selectedChannels.length > 0 && props.formValues?.title);
});

const changesRequiredMessage = computed(() => {
  if (!props.formValues?.title) {
    return "A title is required.";
  } else if (props.formValues?.selectedChannels.length === 0) {
    return "Must select at least one channel.";
  }
  return "";
});

// Lifecycle hooks
onMounted(() => {
  if (titleInputRef.value) {
    nextTick(() => {
      titleInputRef.value?.focus();
    });
  }
});
</script>

<template>
  <div class="flex w-full flex-col items-center justify-center">
    <div class="mx-auto w-full max-w-3xl">
      <div v-if="discussionLoading">
        Loading...
      </div>
      <div v-if="getDiscussionError">
        <ErrorBanner
          v-for="(error, i) of getDiscussionError?.graphQLErrors"
          :key="i"
          :text="error.message"
        />
      </div>
      <ErrorBanner
        v-else-if="createDiscussionError"
        :text="createDiscussionError.message"
      />
      <ErrorBanner
        v-else-if="updateDiscussionError"
        :text="updateDiscussionError.message"
      />
      <TailwindForm
        v-if="formValues"
        :form-title="formTitle"
        :needs-changes="needsChanges"
        :loading="createDiscussionLoading || updateDiscussionLoading"
        @input="touched = true"
        @submit="$emit('submit')"
      >
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
              section-title="Title"
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
              </template>
            </FormRow>

            <FormRow
              section-title="Forums"
              :required="true"
            >
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

            <FormRow section-title="Details">
              <template #content>
                <TextEditor
                  class="mb-3"
                  :test-id="'body-input'"
                  :disable-auto-focus="true"
                  :initial-value="formValues.body || ''"
                  :placeholder="'Add details'"
                  :rows="10"
                  @update="$emit('updateFormValues', { body: $event })"
                />
              </template>
            </FormRow>

            <FormRow section-title="Tags">
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
