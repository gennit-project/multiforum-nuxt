<script lang="ts" setup>
import { computed } from 'vue';
import { config } from '@/config';
import { useBranding } from '@/composables/useBranding';

const { branding } = useBranding();
const logoAlt = computed(
  () => branding.value.logoAlt || config.serverDisplayName
);
</script>

<template>
  <span class="block shrink-0">
    <img
      v-if="branding.logoUrl"
      class="h-8 max-w-48 object-contain object-left"
      :class="{ 'dark:hidden': branding.logoDarkUrl }"
      :src="branding.logoUrl"
      :alt="logoAlt"
    />
    <img
      v-if="branding.logoDarkUrl"
      class="hidden h-8 max-w-48 object-contain object-left dark:block"
      :src="branding.logoDarkUrl"
      :alt="logoAlt"
    />
    <span
      v-if="!branding.logoUrl"
      class="block truncate"
      :class="{ 'dark:hidden': branding.logoDarkUrl }"
    >
      {{ config.serverDisplayName }}
    </span>
  </span>
</template>
