<script setup lang="ts">
import MarkdownLoader from '@/components/MarkdownLoader.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'About' });
</script>

<template>
  <NuxtLayout>
    <MarkdownLoader slug="about" />
  </NuxtLayout>
</template>
