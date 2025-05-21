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
      <div class="mt-2 flex items-center space-y-2 px-4 font-bold">
        <ChannelIcon class="h-6 w-6" />
        <h1 class="ml-4 mt-8 text-xl no-underline">
          {{ channelId }}
        </h1>
      </div>
      <slot />
    </div>
  </section>
</template>
