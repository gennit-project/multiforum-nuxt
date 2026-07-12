<script setup lang="ts">
import MarkdownLoader from '@/components/MarkdownLoader.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Terms of Use' });
</script>

<template>
  <NuxtLayout>
    <MarkdownLoader slug="terms/terms-of-use" />
  </NuxtLayout>
</template>
