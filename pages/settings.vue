<script lang="ts">
  import { defineComponent, computed } from "vue";
  import Breadcrumbs from "@/components/nav/Breadcrumbs.vue";

  export default defineComponent({
    components: {
      Breadcrumbs,
    },
    setup() {
      const links = computed(() => {
        return [
          {
            label: "Settings",
            path: "settings",
          },
        ];
      });
      return {
        links,
      };
    },
  });
</script>

<template>
  <div class="flex-1 px-10 text-xl font-bold">
    <Breadcrumbs :links="links" />
    <h2
      class="font-extrabold mb-2 ml-2 mt-6 inline text-3xl tracking-tight text-gray-900 sm:block sm:text-4xl"
    >
      Settings
    </h2>
  </div>
</template>
