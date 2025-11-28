<script lang="ts" setup>
import type { PropType } from 'vue';
import XmarkIcon from '@/components/icons/XmarkIcon.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import SaveButton from '@/components/SaveButton.vue';
import CancelButton from '@/components/CancelButton.vue';

defineProps({
  currentImage: {
    type: Object as PropType<any>,
    default: null,
  },
  isEditing: {
    type: Boolean,
    required: true,
  },
  editingCaption: {
    type: String,
    required: true,
  },
  isLoggedInAuthor: {
    type: Boolean,
    required: true,
  },
  updateLoading: {
    type: Boolean,
    default: false,
  },
  panelOnSide: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  'close-panel',
  'start-editing',
  'update-caption',
  'save-caption',
  'cancel-editing',
]);
</script>

<template>
  <div class="relative p-5">
    <button
      class="bg-transparent absolute right-2 top-4 rounded-full border-0 p-1 text-white transition-colors hover:bg-gray-800"
      title="Close panel"
      @click="emit('close-panel')"
    >
      <XmarkIcon class="h-4 w-4" />
    </button>
    <div
      v-if="isEditing"
      class="mb-4 mt-8 pb-2"
      @click.stop
      @mousedown.stop
      @touchstart.stop
      @mousemove.stop
      @mouseup.stop
    >
      <TextEditor
        class="text-editor-container"
        :initial-value="editingCaption"
        placeholder="Write a caption for this image..."
        :rows="3"
        @update="(text) => emit('update-caption', text)"
        @click.stop
        @mousedown.stop
        @touchstart.stop
        @mousemove.stop
        @mouseup.stop
        @input.stop
        @keydown.stop
        @keyup.stop
      />
      <div class="mt-2 flex gap-2">
        <SaveButton
          :disabled="updateLoading"
          :loading="updateLoading"
          @click.stop="emit('save-caption')"
        />
        <CancelButton @click.stop="emit('cancel-editing')" />
      </div>
    </div>
    <div
      v-else-if="currentImage?.caption"
      class="text-md relative mb-4 border-white border-opacity-20 pb-2 pr-6"
    >
      <div class="flex items-start justify-between">
        <span class="flex-1">
          {{ currentImage.caption || 'Image Details' }}</span
        >
        <span
          v-if="isLoggedInAuthor"
          class="bg-transparent cursor-pointer rounded-full border-0 px-2 text-white transition-colors hover:bg-gray-800"
          role="button"
          tabindex="0"
          title="Edit caption"
          @click="emit('start-editing')"
          @keydown.enter="emit('start-editing')"
          @keydown.space="emit('start-editing')"
        >
          <PencilIcon class="h-4 w-4" />
        </span>
      </div>

      <!-- More Details button -->
      <div v-if="currentImage?.Uploader?.username" class="mt-3">
        <NuxtLink
          :to="`/u/${currentImage.Uploader.username}/images/${currentImage.id}`"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          More Details
        </NuxtLink>
      </div>
    </div>
    <div v-else class="relative italic text-gray-400">
      <span v-if="!isLoggedInAuthor">No caption available for this image.</span>
      <span
        v-else
        class="flex cursor-pointer items-center gap-1 text-orange-400 transition-colors hover:text-orange-300"
        role="button"
        tabindex="0"
        @click="emit('start-editing')"
        @keydown.enter="emit('start-editing')"
        @keydown.space="emit('start-editing')"
      >
        <PencilIcon class="h-4 w-4" />
        <span>Add a caption for this image</span>
      </span>

      <!-- More Details button for images without captions -->
      <div v-if="currentImage?.Uploader?.username" class="mt-3">
        <NuxtLink
          :to="`/u/${currentImage.Uploader.username}/images/${currentImage.id}`"
          class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          More Details
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
