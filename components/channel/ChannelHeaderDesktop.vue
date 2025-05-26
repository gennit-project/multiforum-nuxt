<script setup>
  defineProps({
    adminList: {
      type: Array,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    channel: {
      type: Object,
      required: true,
    },
    route: {
      type: Object,
      required: true,
    },
    showCreateButton: {
      type: Boolean,
      required: true,
    },
  });
</script>

<template>
  <div class="w-full">
    <img
      v-if="channel?.channelBannerURL"
      :alt="'channel banner'"
      class="max-h-36 w-full object-cover"
      :src="channel?.channelBannerURL"
    >
  </div>
</template>
