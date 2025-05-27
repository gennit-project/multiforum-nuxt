<script lang="ts">
import { defineComponent } from "vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";

export default defineComponent({
  components: {
    ChannelIcon,
  },
  props: {
    channelId: {
      type: String,
      required: true,
    },
  },
  setup() {},
});
</script>

<template>
  <section aria-labelledby="section-2-title">
    <div class="overflow-hidden">
      <div class="space-y-2 px-4 mt-2 flex items-center font-bold">
        <ChannelIcon class="h-6 w-6" />
        <h1 class="text-xl mt-8 ml-4 no-underline">
          {{ channelId }}
        </h1>
      </div>
      <slot />
    </div>
  </section>
</template>
