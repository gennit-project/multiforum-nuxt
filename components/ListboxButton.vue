<script lang="ts">
import { defineComponent } from "vue";
import SelectorIcon from "@/components/icons/ChevronUpDownIcon.vue"
import { ListboxButton} from '@headlessui/vue'

export default defineComponent({
  components: {
      SelectorIcon,
      ListboxButton
  },
  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<template>
  <ListboxButton
    class="
      bg-white dark:bg-gray-900
      dark:text-gray-200
      relative
      w-full
      border border-gray-300
      rounded-md
      shadow-sm
      pl-3
      pr-10
      py-2
      text-left
      cursor-default
      focus:outline-none
      focus:ring-1
      focus:ring-blue-500
      focus:border-blue-500
      sm:text-sm
    "
  >
    <span class="block truncate">{{ label }}</span>
    <span
      class="
        absolute
        inset-y-0
        right-0
        flex
        items-center
        pr-2
        pointer-events-none
      "
    >
      <SelectorIcon
        class="h-5 w-5 text-gray-400"
        aria-hidden="true"
      />
    </span>
  </ListboxButton>
</template>