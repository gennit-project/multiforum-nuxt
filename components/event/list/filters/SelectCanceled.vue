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
            type="checkbox"
            :data-testid="'canceled-checkbox'"
            class="text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded"
            :checked="copyOfShowCanceled"
            @input="() => toggleCanceled()"
          >
          <span class="ml-2 text-sm font-medium whitespace-nowrap dark:text-white"
            >Include canceled events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
