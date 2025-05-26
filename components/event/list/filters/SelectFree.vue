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
      <div class="cursor-pointer rounded p-2">
        <label
          class="flex items-center"
          :for="'free'"
        >
          <input
            :checked="copyOfShowOnlyFree"
            class="mr-1 h-4 w-4 rounded border border-gray-400 text-orange-600 focus:ring-orange-500"
            :data-testid="'free-checkbox'"
            type="checkbox"
            @input="() => toggleShowOnlyFree()"
          >
          <span class="ml-2 whitespace-nowrap text-sm font-medium dark:text-white"
            >Show only free events</span
          >
        </label>
      </div>
    </div>
  </div>
</template>
