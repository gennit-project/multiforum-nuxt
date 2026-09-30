<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  showCanceled: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['updateShowCanceled']);

const copyOfShowCanceled = ref(props.showCanceled);

const toggleCanceled = () => {
  copyOfShowCanceled.value = !copyOfShowCanceled.value;
  emit('updateShowCanceled', copyOfShowCanceled.value);
};
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div class="cursor-pointer rounded p-2">
        <label for="canceled-checkbox" class="flex items-center">
          <input
            id="canceled-checkbox"
            type="checkbox"
            :data-testid="'canceled-checkbox'"
            class="text-brand-600 focus:ring-brand-500 mr-1 h-4 w-4 rounded border border-gray-400"
            :checked="copyOfShowCanceled"
            @input="() => toggleCanceled()"
          />
          <span
            class="ml-2 text-sm font-medium whitespace-nowrap dark:text-white"
            >Include canceled events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
