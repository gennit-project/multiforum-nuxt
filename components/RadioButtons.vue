<script lang="js">
import { defineComponent, ref } from 'vue'

export default defineComponent({
    props: {
        selectedOption: {
            type: Object,
            required: true
        },
        options: {
            type: Array,
            required: true
        },
    },
    setup(props) {
        const selected = ref(props.selectedOption)

        return { selected }
    },
    watch: {
      selectedOption: function(newValue) {
        this.selected = newValue
      }
    }
})
</script>
<template>
  <form>
    <fieldset>
      <div
        v-for="option in options"
        :key="option.label"
        class="flex items-center mt-4"
      >
        <input
          name="showBothVirtualAndInPerson"
          type="radio"
          :checked="selected.value === option.value"
          class="
            focus:ring-blue-500
            h-4
            w-4
            text-blue-600
            border border-gray-300
          "
          @input="
            () => {
              $emit('updateSelected', option);
              selected = option;
            }
          "
        >
        <label class="ml-3 block text-sm font-medium text-gray-700">
          {{ option.label }}
        </label>
      </div>
    </fieldset>
  </form>
</template>
