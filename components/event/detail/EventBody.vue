<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { Event } from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import EventDescriptionEditForm from './EventDescriptionEditForm.vue';

const usernameVar = useUsername();

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: true,
  },
  eventDescriptionEditMode: {
    type: Boolean,
    required: false,
    default: false,
  },
});
defineEmits(['handleClickEditEventDescription', 'closeEditEventDescription']);

const description = computed(() => {
  return props.event.description;
});
</script>
<template>
  <div>
    <EventDescriptionEditForm
      v-if="eventDescriptionEditMode"
      :event="event"
      @close-editor="$emit('closeEditEventDescription')"
    />
    <div v-else class="flex items-start gap-4">
      <MarkdownPreview
        class="min-w-0 flex-1 text-[0.95rem] leading-7 text-gray-800 dark:text-gray-200"
        :text="description || ''"
        :disable-gallery="false"
      />
      <div v-if="usernameVar === event.Poster?.username" class="shrink-0">
        <button
          v-if="!eventDescriptionEditMode"
          type="button"
          class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
          @click="$emit('handleClickEditEventDescription')"
        >
          Edit
        </button>
        <button
          v-else-if="usernameVar"
          type="button"
          class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
          @click="$emit('closeEditEventDescription')"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
