<script lang="ts" setup>
import { computed } from "vue";
import type { PropType } from "vue";
import type { ServerConfig } from "@/__generated__/graphql";
import RulesComponent from "@/components/channel/Rules.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

const props = defineProps({
  serverConfig: {
    type: Object as PropType<ServerConfig>,
    required: true,
  },
  useScrollbar: {
    type: Boolean,
    default: true,
  },
});

const serverRules = computed(() => props.serverConfig?.rules ?? "");
const serverDescription = computed(() => props.serverConfig?.serverDescription ?? "");
</script>

<template>
  <div
    :class="[useScrollbar ? 'max-h-screen overflow-auto' : '']"
    class="bg-white pb-8 pt-4 dark:bg-gray-800"
  >
    <div class="items-center gap-2" />

    <div>
      <h2 class="mt-2 text-xl font-bold dark:text-white">Admin Dashboard</h2>
      <MarkdownPreview
        v-if="serverDescription"
        :text="serverDescription"
        :word-limit="1000"
      />
      <p v-else class="text-xs dark:text-white">
        Welcome to the admin dashboard. Here is where you can edit server settings and manage server scoped issues.
      </p>
    </div>

    <slot />

    <div class="w-full">
      <div>
        <div class="mt-6 flex w-full flex-col gap-6">
          <div v-if="serverRules && serverRules !== '[]'" :key="serverRules">
            <span
              class="my-2 mb-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
              >Server Rules</span
            >
            <RulesComponent :rules="serverRules" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
