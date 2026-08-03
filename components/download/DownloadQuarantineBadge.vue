<script setup lang="ts">
import { computed } from 'vue';

type ScanStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'SUSPICIOUS' | 'FAILED';

const props = defineProps<{
  status?: ScanStatus | null;
}>();

const badge = computed(() => {
  switch (props.status) {
    case 'CLEAN':
      return { label: 'Verified', classes: 'bg-green-700 text-white' };
    case 'INFECTED':
      return { label: 'Quarantined', classes: 'bg-red-700 text-white' };
    case 'SUSPICIOUS':
      return { label: 'Quarantined', classes: 'bg-amber-600 text-black' };
    case 'FAILED':
      return { label: 'Scan failed', classes: 'bg-sky-700 text-white' };
    default:
      return { label: 'Scanning', classes: 'bg-gray-800 text-white' };
  }
});
</script>

<template>
  <span
    class="rounded-full px-2 py-1 text-xs font-semibold shadow"
    :class="badge.classes"
    data-testid="download-quarantine-badge"
  >
    {{ badge.label }}
  </span>
</template>
