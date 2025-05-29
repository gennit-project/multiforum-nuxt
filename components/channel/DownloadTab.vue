<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "DownloadTab",

    setup() {
      // The only reason I have this component is so the download
      // tab in a channel will be marked active for the search
      // download component AND the download detail component.
      // They need to both be children of the same route in the router
      // in order for the download tab to be active for both.
      // Hence this dummy component.
    },
  });
</script>

<template>
  <NuxtPage />
</template>
