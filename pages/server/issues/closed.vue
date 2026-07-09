<script lang="ts" setup>
import ServerIssueList from '@/components/mod/ServerIssueList.vue';
</script>

<template>
  <ServerIssueList
    :is-open="false"
    search-placeholder="Search closed issues"
    search-test-id="closed-issue-search-input"
  />
</template>
