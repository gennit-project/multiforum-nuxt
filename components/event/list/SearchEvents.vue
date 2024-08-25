<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { router } from "@/router";
import { useRoute } from "vue-router";
import { DateTime } from "luxon";

export default defineComponent({
  name: "SearchEvents",
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    const now = DateTime.now();

    return {
      channelId,
      loadedEventCount: ref(0),
      now,
      placeData: null,
      route,
      router,
    };
  },
  methods: {
    goToMap() {
      if (!this.channelId) {
        this.router.push({
          name: "MapView",
          query: {
            ...this.$route.query,
          },
        });
      } else {
        this.router.push({
          name: "MapView",
          query: {
            ...this.$route.query,
            channels: [this.channelId],
            backToChannel: this.channelId,
          },
        });
      }
    },
    setLoadedEventCount(event: any) {
      this.loadedEventCount = event;
    },
    setResultCount(event: any) {
      this.resultCount = event;
    },
  },
});
</script>
<template>
  <div
    class="flex h-full justify-center"
    :class="channelId ? '' : 'mt-6'"
  >
    <div :class="channelId ? '' : 'max-w-5xl'">
      <router-view
        @updateLoadedEventCount="setLoadedEventCount"
        @updateResultCount="setResultCount"
      />
    </div>
  </div>
</template>

<style>
.gray {
  color: gray;
}
</style>
