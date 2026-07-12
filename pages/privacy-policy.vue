<script setup lang="ts">
import MarkdownLoader from '@/components/MarkdownLoader.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Privacy Policy' });
</script>

<template>
  <NuxtLayout>
    <MarkdownLoader slug="terms/privacy-policy" />
  </NuxtLayout>
</template>
