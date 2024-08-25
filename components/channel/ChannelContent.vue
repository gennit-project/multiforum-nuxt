<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import ChannelSidebar from "@/components/channel/ChannelSidebar.vue";
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import { useDisplay } from "vuetify";

export default defineComponent({
  name: "ChannelContent",
  components: {
    ChannelSidebar,
  },

  setup() {
    const route = ref(useRoute());

    const channelId = computed(() => {
      if (typeof route.value.params.channelId !== "string") {
        return "";
      }
      return route.value.params.channelId;
    });

    const {
      error: getChannelError,
      result: getChannelResult,
      loading: getChannelLoading,
    } = useQuery(GET_CHANNEL, {
      uniqueName: channelId,
      now: new Date().toISOString(),
    });

    const channel = computed(() => {
      if (getChannelLoading.value || getChannelError.value) {
        return null;
      }
      const channel = getChannelResult.value.channels[0];
      return channel;
    });

    const { mdAndDown } = useDisplay();
    return {
      channelId,
      channel,
      mdAndDown,
    };
  },
});
</script>

<template>
  <v-container
    fluid
    class="relative max-w-7xl flex-1 pt-4 focus:outline-none lg:px-6 xl:order-last"
  >
    <v-row class="flex divide-x dark:divide-gray-500">
      <v-col
        :cols="mdAndDown ? 12 : 8"
        class="p-0 bg-white dark:bg-gray-800"
      >
        <slot />
      </v-col>
      <v-col
        v-if="channelId"
        :cols="mdAndDown ? 12 : 4"
        class="p-0 bg-white dark:bg-gray-800"
      >
        <ChannelSidebar
          v-if="channel"
          :channel="channel"
          class="sticky top-0 overflow-auto p-6 pt-8"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
