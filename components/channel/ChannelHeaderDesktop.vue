<script setup>
import CreateAnythingButton from "../nav/CreateAnythingButton.vue";
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
      :alt="'channel banner'"
      class="max-h-36 object-cover w-full"
    >
  </div>
</template>
