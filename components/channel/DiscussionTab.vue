<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "DiscussionTab",

    setup() {
      // The only reason I have this component is so the discussion
      // tab in a channel will be marked active for the search
      // discussion component AND the discussion detail component.
      // They need to both be children of the same route in the router
      // in order for the discussion tab to be active for both.
      // Hence this dummy component.
    },
  });
</script>

<template>
  <NuxtPage />
</template>
