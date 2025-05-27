<script lang="ts" setup>
import type { PropType } from "vue";
import { defineProps, defineEmits, computed } from "vue";
import type { Event } from "@/__generated__/graphql";
import { usernameVar } from "@/cache";
import EventDescriptionEditForm from "./EventDescriptionEditForm.vue";

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
defineEmits(["handleClickEditEventDescription", "closeEditEventDescription"]);

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
    <div  v-else class="flex">
    <MarkdownPreview  :text="description || ''" :disable-gallery="false" />
    <div v-if="usernameVar === event.Poster?.username">
      <button
        v-if="!eventDescriptionEditMode"
        type="button"
        class="text-xs text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        @click="$emit('handleClickEditEventDescription')"
      >
        Edit
      </button>
      <button
        v-else-if="usernameVar"
        type="button"
        class="text-xs text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
        @click="$emit('closeEditEventDescription')"
      >
        Cancel
      </button>
    </div>
  </div>
  </div>
</template>
