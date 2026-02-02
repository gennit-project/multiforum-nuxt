<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import XmarkIcon from '@/components/icons/XmarkIcon.vue';
import TextInput from '@/components/TextInput.vue';
import FormRow from '@/components/FormRow.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ExpandableImage from '@/components/ExpandableImage.vue';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';

type ImageData = {
  id?: string;
  url: string;
  alt: string;
  caption: string;
  copyright: string;
};

defineProps<{
  image: ImageData;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-field', field: keyof ImageData, value: string): void;
  (e: 'delete' | 'move-up' | 'move-down'): void;
}>();

const { mdAndDown } = useDisplay();
</script>

<template>
  <div class="mb-4 border-b py-2">
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center">
        <span class="font-bold dark:text-white">Image {{ index + 1 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="ml-4 flex gap-1">
          <button
            type="button"
            class="rounded border border-gray-300 px-2 py-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
            :disabled="isFirst"
            :class="{ 'cursor-not-allowed opacity-50': isFirst }"
            @click="emit('move-up')"
          >
            ↑
          </button>
          <button
            type="button"
            class="rounded border border-gray-300 px-2 py-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
            :disabled="isLast"
            :class="{ 'cursor-not-allowed opacity-50': isLast }"
            @click="emit('move-down')"
          >
            ↓
          </button>
        </div>
        <button
          type="button"
          class="flex items-center gap-1 rounded border border-gray-500 px-2 py-1 text-gray-500 dark:border-gray-600 dark:text-gray-200"
          @click="emit('delete')"
        >
          <XmarkIcon class="h-4" />
          Delete
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="isLoading" class="mb-2" />

    <div :class="[mdAndDown ? 'flex-col' : 'flex', 'gap-2']">
      <div>
        <ModelViewer
          v-if="image.url && hasGlbExtension(image.url)"
          :model-url="image.url"
          height="288px"
          width="288px"
          class="w-72"
        />
        <ClientOnly v-else-if="image.url && hasStlExtension(image.url)">
          <StlViewer
            :src="image.url"
            :width="288"
            :height="288"
            class="w-72"
          />
        </ClientOnly>
        <ExpandableImage
          v-else-if="image.url"
          class="w-72 object-cover"
          :src="image.url"
          :alt="image.alt"
        />
      </div>

      <div class="flex-1 flex-col">
        <FormRow section-title="Image URL">
          <template #content>
            <TextInput
              :value="image.url"
              placeholder="https://example.com/my-image.jpg"
              @update="(val) => emit('update-field', 'url', val)"
            />
          </template>
        </FormRow>
        <FormRow section-title="Alt Text">
          <template #content>
            <TextInput
              :value="image.alt"
              placeholder="Describe the image for accessibility"
              @update="(val) => emit('update-field', 'alt', val)"
            />
          </template>
        </FormRow>
        <FormRow section-title="Caption">
          <template #content>
            <TextInput
              :value="image.caption"
              placeholder="Short caption or description"
              @update="(val) => emit('update-field', 'caption', val)"
            />
          </template>
        </FormRow>
        <FormRow section-title="Attribution/Copyright">
          <template #content>
            <TextInput
              :value="image.copyright"
              placeholder="Who took this photo? (optional)"
              @update="(val) => emit('update-field', 'copyright', val)"
            />
          </template>
        </FormRow>
      </div>
    </div>
  </div>
</template>
