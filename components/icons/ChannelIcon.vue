<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ChannelIcon',
  setup() {},
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="channel-icon"
    aria-hidden="true"
  >
<<<<<<< HEAD
    <linearGradient
      id="pinkToLightorangeGradient"
      x1="0%"
      x2="100%"
      y1="0%"
      y2="0%"
    >
      <stop
        offset="0%"
        stop-color="#FF98C7"
      />
      <stop
        offset="100%"
        stop-color="#85E0FF"
      />
=======
    <linearGradient id="pinkToLightBlueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF98C7" />
      <stop offset="100%" stop-color="#85E0FF" />
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    </linearGradient>

    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
    />
  </svg>
</template>

<style>
.channel-icon {
  min-width: 16px;
  min-height: 16px;
}
@media (max-width: 768px) {
  .channel-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
