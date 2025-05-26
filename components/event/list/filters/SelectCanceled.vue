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
      <div class="cursor-pointer rounded p-2">
        <label
          class="flex items-center"
          :for="'canceled'"
        >
          <input
            :checked="copyOfShowCanceled"
            class="mr-1 h-4 w-4 rounded border border-gray-400 text-orange-600 focus:ring-orange-500"
            :data-testid="'canceled-checkbox'"
            type="checkbox"
            @input="() => toggleCanceled()"
          >
          <span class="ml-2 whitespace-nowrap text-sm font-medium dark:text-white"
            >Include canceled events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
