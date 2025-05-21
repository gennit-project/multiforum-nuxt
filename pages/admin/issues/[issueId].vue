<script setup lang="ts">
  import IssueDetail from "@/components/mod/IssueDetail.vue";
</script>

<template>
  <NuxtLayout>
    <IssueDetail :is-forum-scoped="false" />
  </NuxtLayout>
</template>
