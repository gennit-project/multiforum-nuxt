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
        class="w-full lg:w-1/3 constrain-height lg:sticky lg:top-0"
      >
        <slot name="leftpane" />
      </div>
      <div
        v-if="showRightPaneAtMediumScreenWidth"
        class="w-full md:w-2/3 p-0"
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
