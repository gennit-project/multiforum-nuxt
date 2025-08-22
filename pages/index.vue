<template>
  <div>
    <h1>Redirecting...</h1>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from 'nuxt/app';

// Redirect the user to /discussions using navigateTo
await navigateTo('/discussions');
</script>
