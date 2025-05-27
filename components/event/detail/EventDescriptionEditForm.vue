<script lang="ts" setup>
import { ref } from "vue";
import type { PropType } from "vue";
import type { Event } from "@/__generated__/graphql";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import { useMutation } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/event/mutations";
import { MAX_CHARS_IN_EVENT_DESCRIPTION } from "@/utils/constants";

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: true,
  },
});
const emits = defineEmits(["closeEditor"]);
const formValues = ref({
  description: props.event?.description || "",
});

const {
  mutate: updateEvent,
  error: updateEventError,
  loading: updateEventLoading,
  onDone,
} = useMutation(UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    where: { id: props.event.id },
    updateEventInput: formValues.value,
    channelConnections: [],
    channelDisconnections: [],
  },
}));

onDone(() => {
  emits("closeEditor");
});
</script>

<template>
  <div class="w-full">
    <div class="mb-3 mt-3 w-full flex flex-col">
      <TextEditor
        class="mb-3"
        :test-id="'body-input'"
        :disable-auto-focus="false"
        :initial-value="formValues.description || ''"
        :placeholder="'Add details'"
        :rows="8"
        @update="formValues.description = $event"
      />
      <CharCounter
        :current="formValues.description?.length || 0"
        :max="MAX_CHARS_IN_EVENT_DESCRIPTION"
      />
      <div class="flex align-items gap-2 justify-end">
        <GenericButton :text="'Cancel'" @click="emits('closeEditor')" />
        <PrimaryButton
          :disabled="
            formValues.description.length === 0 ||
            formValues.description.length > MAX_CHARS_IN_EVENT_DESCRIPTION
          "
          :label="'Save'"
          :loading="updateEventLoading"
          @click="updateEvent"
        />
      </div>
    </div>
    <ErrorBanner
      v-if="updateEventError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateEventError.message"
    />
  </div>
</template>
