<script setup lang="ts">
import { computed } from 'vue';
import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';
import { useIsAuthenticated } from '@/composables/useAuthState';

const isAuthenticatedVar = useIsAuthenticated();

type ChannelWithFavoriteState = {
  isFavorited?: boolean | null;
  channelIconURL?: string | null;
  displayName?: string | null;
  uniqueName?: string | null;
};

const props = defineProps({
  channelId: {
    type: String,
    required: true,
  },
  channel: {
    type: Object,
    required: true,
  },
});

const initialIsFavorited = computed(
  () => (props.channel as ChannelWithFavoriteState)?.isFavorited ?? undefined
);
</script>

<template>
  <div class="flex items-center justify-between">
    <div
      class="mb-2 flex flex-row items-center justify-center gap-4 dark:bg-black"
    >
      <AvatarComponent
        class="align-items my-2 ml-2 flex h-14 w-14 justify-center pt-2 shadow-sm"
        :text="channelId"
        :src="channel?.channelIconURL ?? ''"
        :is-square="false"
      />
      <div v-if="channel.displayName && channel.uniqueName" class="mt-4">
        <h1
          v-if="channel.displayName"
          class="text-outline mt-4 flex border-gray-700 text-2xl leading-6 text-black dark:text-white"
        >
          {{ channel.displayName }}
        </h1>
        <h2 class="font-mono text-sm leading-6 text-black dark:text-gray-300">
          {{ `${channel.uniqueName}` }}
        </h2>
      </div>
      <h1
        v-else
        class="mb-0 mt-6 flex border-gray-700 text-2xl leading-6 text-black dark:text-white"
      >
        {{ channelId }}
      </h1>
    </div>
    <ClientOnly>
      <div v-if="isAuthenticatedVar" class="flex items-center pr-4">
        <AddToChannelFavorites
          :allow-add-to-list="true"
          :channel-unique-name="channelId"
          :channel-display-name="channel?.displayName || ''"
          :initial-is-favorited="initialIsFavorited"
          size="medium"
        />
      </div>
    </ClientOnly>
  </div>
</template>
