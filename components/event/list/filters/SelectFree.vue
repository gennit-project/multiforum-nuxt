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
<<<<<<< HEAD
            :checked="copyOfShowOnlyFree"
            class="mr-1 h-4 w-4 rounded border border-gray-400 text-orange-600 focus:ring-orange-500"
            :data-testid="'free-checkbox'"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            type="checkbox"
            :data-testid="'free-checkbox'"
            class="border text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded"
            :checked="copyOfShowOnlyFree"
            @input="() => toggleShowOnlyFree()"
          >
<<<<<<< HEAD
          <span class="ml-2 whitespace-nowrap text-sm font-medium dark:text-white"
=======
          <span class="ml-2 text-sm font-medium whitespace-nowrap dark:text-white"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            >Show only free events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
