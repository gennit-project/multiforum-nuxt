<script lang="ts" setup>
import type { DiscussionPresentation as Discussion } from '@/types/DiscussionPresentation';
import { ref } from 'vue';
import type { PropType } from 'vue';
import type { DiscussionUpdateInput } from '@/__generated__/graphql';
import PrimaryButton from '@/components/PrimaryButton.vue';
import GenericButton from '@/components/GenericButton.vue';
import { useMutation } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { UpdateDiscussionDocument as UPDATE_DISCUSSION } from '@/__generated__/operations';
import { MAX_CHARS_IN_DISCUSSION_BODY } from '@/utils/constants';

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
  allowImageUpload: {
    type: Boolean,
    default: true,
  },
  channelConnections: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});
const emit = defineEmits(['closeEditor']);

const formValues = ref({
  body: props.discussion?.body || '',
});

function getUpdateDiscussionInputFromFormValues(): DiscussionUpdateInput {
  // Only update the discussion body
  return {
    body: { set: formValues.value.body },
  };
}

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION, () => ({
  variables: {
    where: { id: { eq: props.discussion.id } },
    updateDiscussionInput: getUpdateDiscussionInputFromFormValues(),
  },
}));

onDone(() => {
  emit('closeEditor');
});
</script>

<template>
  <div class="w-full">
    <div class="mt-3 mb-3 flex w-full flex-col">
      <TextEditor
        class="mb-3"
        :test-id="'body-input'"
        :disable-auto-focus="false"
        :initial-value="formValues.body || ''"
        :placeholder="'Add details'"
        :rows="8"
        :allow-image-upload="allowImageUpload"
        :channel-connections="channelConnections"
        @update="formValues.body = $event"
      />

      <CharCounter
        :current="formValues.body?.length || 0"
        :max="MAX_CHARS_IN_DISCUSSION_BODY"
      />
      <div class="align-items mt-2 flex justify-end gap-2">
        <GenericButton :text="'Cancel'" @click="emit('closeEditor')" />
        <PrimaryButton
          :disabled="formValues.body.length > MAX_CHARS_IN_DISCUSSION_BODY"
          :label="'Save'"
          :loading="updateDiscussionLoading"
          @click="updateDiscussion"
        />
      </div>
    </div>
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>
