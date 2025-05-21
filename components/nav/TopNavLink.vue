<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    props: {
      to: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
    },
    setup() {},
  });
</script>

<template>
  <nuxt-link
    active-class="
      inline-flex
      items-center
      border-b-2
      border-blue-500
      text-blue-500
      dark:text-blue-400
      dark:border-blue-400
      hover:dark:text-blue-400
      px-4
      py-3
      text-xs
      font-medium
      "
    class="border-b-3 border-transparent group inline-flex items-center px-4 py-3 text-xs font-medium hover:border-blue-500 hover:text-blue-500 dark:text-white hover:dark:text-gray-200"
    :to="to"
  >
    <div>
      <slot />
    </div>
    {{ label }}
  </nuxt-link>
</template>
