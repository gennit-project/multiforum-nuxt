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
    <div
      v-else
      class="flex"
    >
      <MarkdownPreview
        :disable-gallery="false"
        :text="description || ''"
      />
      <div v-if="usernameVar === event.Poster?.username">
        <button
          v-if="!eventDescriptionEditMode"
          class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
          type="button"
          @click="$emit('handleClickEditEventDescription')"
        >
          Edit
        </button>
        <button
          v-else-if="usernameVar"
          class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
          type="button"
          @click="$emit('closeEditEventDescription')"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
