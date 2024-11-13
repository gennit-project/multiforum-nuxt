<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  showOnlyFree: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["updateShowOnlyFree"]);

const copyOfShowOnlyFree = ref(props.showOnlyFree);

const toggleShowOnlyFree = () => {
  copyOfShowOnlyFree.value = !copyOfShowOnlyFree.value;
  emit("updateShowOnlyFree", copyOfShowOnlyFree.value);
};
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div class="p-2 rounded cursor-pointer">
        <label :for="'free'" class="flex items-center">
          <input
            type="checkbox"
            :data-testid="'free-checkbox'"
            class="border text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded"
            :checked="copyOfShowOnlyFree"
            @input="() => toggleShowOnlyFree()"
          >
          <span class="ml-2 text-sm font-medium whitespace-nowrap dark:text-white"
            >Show only free events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
