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
  <div>
    <div
      class="flex flex-row pb-4 items-center justify-center gap-4 bg-black mb-2"
    >
      <AvatarComponent
        class="flex justify-center align-items shadow-sm dark:border-gray-800 pt-2"
        :text="channelId"
        :src="channel?.channelIconURL ?? ''"
        :is-medium="true"
        :is-square="false"
      />
      <div v-if="channel.displayName && channel.uniqueName" class="mt-4">
        <h1
          v-if="channel.displayName"
          class="flex border-gray-700 mt-2 text-2xl leading-6 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
        >
          {{ channel.displayName }}
        </h1>
        <h2
          class="text-sm font-mono leading-6 text-white dark:text-gray-300 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
        >
          {{ `${channel.uniqueName}` }}
        </h2>
      </div>
      <div v-else>
        <h1
          class="flex border-gray-700 text-2xl leading-6 text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
        >
          {{ channelId }}
        </h1>
      </div>
    </div>
    <CreateAnythingButton class="mb-4 mx-2" :use-primary-button="true" />
  </div>
</template>