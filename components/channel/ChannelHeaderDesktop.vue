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
      :src="channel?.channelBannerURL"
<<<<<<< HEAD
=======
      :alt="'channel banner'"
      class="max-h-36 object-cover w-full"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    >
  </div>
</template>
