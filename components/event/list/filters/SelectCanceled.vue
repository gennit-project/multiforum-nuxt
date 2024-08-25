<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    showCanceled: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    // take default from params
    return {
      copyOfShowCanceled: ref(props.showCanceled),
    };
  },
  methods: {
    toggleCanceled() {
      this.copyOfShowCanceled = !this.copyOfShowCanceled;
      this.$emit("updateShowCanceled", this.copyOfShowCanceled);
    },
  },
});
</script>
<template>
  <div>
    <div class="grid grid-cols-2 gap-2">
      <div class="p-2 rounded cursor-pointer">
        <label
          :for="'canceled'"
          class="flex items-center"
        >
          <input
            type="checkbox"
            :data-testid="'canceled-checkbox'"
            class="text-blue-600 focus:ring-blue-500 h-4 w-4 mr-1 border-gray-400  rounded"
            :checked="copyOfShowCanceled"
            @input="() => toggleCanceled()"
          >
          <span class="ml-2 text-sm font-medium whitespace-nowrap">Include canceled events</span>
        </label>
      </div>
    </div>
  </div>
</template>
