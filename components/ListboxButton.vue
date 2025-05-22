<script lang="ts">
  import { defineComponent } from "vue";
  import SelectorIcon from "@/components/icons/ChevronUpDownIcon.vue";
  import { ListboxButton } from "@headlessui/vue";

  export default defineComponent({
    components: {
      SelectorIcon,
      ListboxButton,
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
    class="focus:border-orange-500 focus:ring-orange-500 relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 sm:text-sm"
  >
    <span class="block truncate">{{ label }}</span>
    <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
      <SelectorIcon
        aria-hidden="true"
        class="h-5 w-5 text-gray-400"
      />
    </span>
  </ListboxButton>
</template>
