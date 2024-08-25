<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "SelectFree",
  props: {
    showOnlyFree: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    // take default from params
    return {
      copyOfShowOnlyFree: ref(props.showOnlyFree),
    };
  },
  methods: {
    toggleShowOnlyFree() {
      this.copyOfShowOnlyFree = !this.copyOfShowOnlyFree;
      this.$emit("updateShowOnlyFree", this.copyOfShowOnlyFree);
    },
  },
});
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div class="p-2 rounded cursor-pointer">
        <label
          :for="'free'"
          class="flex items-center"
        >
          <input
            type="checkbox"
            :data-testid="'free-checkbox'"
            class="text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400 rounded"
            :checked="copyOfShowOnlyFree"
            @input="() => toggleShowOnlyFree()"
          >
          <span class="ml-2 text-sm font-medium whitespace-nowrap">Show only free events</span>
        </label>
      </div>
    </div>
  </div>
</template>
