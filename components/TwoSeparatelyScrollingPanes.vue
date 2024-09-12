<script lang="ts" setup>
defineProps({
  showRightPaneAtMediumScreenWidth: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div class="w-full p-0">
    <div class="flex flex-wrap w-full">
      <div
        class="w-full lg:w-1/2 constrain-height"
      >
        <slot name="leftpane" />
      </div>
      <div
        v-if="showRightPaneAtMediumScreenWidth"
        class="w-full md:w-1/2 p-0 lg:max-h-screen lg:overflow-y-auto"
      >
        <slot name="rightpane" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.constrain-height {
  max-height: 90vh;
  height: calc(100% - 200px); /* Corrected the height calculation */
}
</style>
