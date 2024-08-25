<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import SiteFooter from "./SiteFooter.vue";

export default defineComponent({
  name: "MainLayout",
  components: {
    SiteFooter,
  },
  setup() {
    const route = useRoute();
    const channelId = computed(() => {
      return route.params.channelId;
    });

    return {
      route,
      channelId,
    };
  },
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <div class="flex-grow">
      <router-view />
    </div>
    <SiteFooter
      v-if="
        route.name &&
          route.name !== 'MapView' &&
          route.name !== 'MapEventPreview'
      "
    />
  </div>
</template>

<style scoped lang="scss">
body {
  @apply bg-gray-100;
}
.text-wrap {
  word-wrap: break-word;
}
</style>
