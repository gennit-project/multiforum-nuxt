<script setup>
defineProps({
  channelId: {
    type: String,
    required: true,
  },
  channel: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-row items-center justify-center gap-4 dark:bg-black mb-2">
      <AvatarComponent
        class="flex h-14 w-14 justify-center align-items shadow-sm pt-2 ml-2 my-2"
        :text="channelId"
        :src="channel?.channelIconURL ?? ''"
        :is-square="false"
      />
      <div v-if="channel.displayName && channel.uniqueName" class="mt-4">
        <h1
          v-if="channel.displayName"
          class="flex border-gray-700 mt-4 text-2xl leading-6 text-black dark:text-white text-outline"
        >
          {{ channel.displayName }}
        </h1>
        <h2
          class="text-sm font-mono leading-6 text-black dark:text-gray-300"
        >
          {{ `${channel.uniqueName}` }}
        </h2>
      </div>
      <h1
        v-else
        class="flex mb-0 mt-6 border-gray-700 text-2xl leading-6 text-black dark:text-white"
      >
        {{ channelId }}
      </h1>
    </div>
  </div>
</template>
