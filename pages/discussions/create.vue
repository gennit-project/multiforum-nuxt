<script lang="ts" setup>
  import CreateDiscussion from "@/components/discussion/form/CreateDiscussion.vue";
</script>
<template>
  <NuxtLayout>
    <div class="flex justify-center">
      <div class="mt-2 w-full max-w-3xl bg-white px-2 pt-2 dark:bg-gray-800">
        <CreateDiscussion />
      </div>
    </div>
  </NuxtLayout>
</template>
