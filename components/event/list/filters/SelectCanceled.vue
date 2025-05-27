<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  showCanceled: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["updateShowCanceled"]);

const copyOfShowCanceled = ref(props.showCanceled);

const toggleCanceled = () => {
  copyOfShowCanceled.value = !copyOfShowCanceled.value;
  emit("updateShowCanceled", copyOfShowCanceled.value);
};
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div class="p-2 rounded cursor-pointer">
        <label :for="'canceled'" class="flex items-center">
          <input
<<<<<<< HEAD
            :checked="copyOfShowCanceled"
            class="mr-1 h-4 w-4 rounded border border-gray-400 text-orange-600 focus:ring-orange-500"
            :data-testid="'canceled-checkbox'"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            type="checkbox"
            :data-testid="'canceled-checkbox'"
            class="text-blue-600 border focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded"
            :checked="copyOfShowCanceled"
            @input="() => toggleCanceled()"
          >
<<<<<<< HEAD
          <span class="ml-2 whitespace-nowrap text-sm font-medium dark:text-white"
=======
          <span class="ml-2 text-sm font-medium whitespace-nowrap dark:text-white"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            >Include canceled events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
