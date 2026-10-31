<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { GetServerConfigQuery } from '@/__generated__/operations';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
type ServerConfig = Pick<
  GetServerConfigQuery['serverConfigs'][number],
  'serverDescription'
>;

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

const serverDescription = computed(
  () => props.serverConfig?.serverDescription ?? ''
);
</script>

<template>
  <div
    :class="[useScrollbar ? 'max-h-screen overflow-auto' : '']"
    class="pt-4 pb-8"
  >
    <div class="items-center gap-2" />

    <div>
      <h2 class="mt-2 text-xl font-bold dark:text-white">Welcome</h2>
      <MarkdownPreview
        v-if="serverDescription"
        :text="serverDescription"
        :word-limit="1000"
      />
      <p v-else class="text-xs dark:text-white">
        Welcome to our community! This is where you can find discussions from
        all forums.
      </p>
    </div>

    <slot />
  </div>
</template>
