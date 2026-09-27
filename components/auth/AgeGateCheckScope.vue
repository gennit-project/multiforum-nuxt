<script setup lang="ts">
import { computed } from 'vue';
import { useDiscussionAgeGateCheck } from '@/composables/useDiscussionAgeGateCheck';

/*
Runs the age-gate check for a discussion the page couldn't load and hands the
result to its slot. Render it only once the discussion is known to be missing:
the check then starts in this component's setup, so server rendering waits for
it (a check enabled later, from a parent's watcher, arrives after the server has
already rendered). The slot is empty until the check resolves, so nothing
flashes "deleted" before it's known.
*/
const props = defineProps<{
  discussionId: string;
}>();

const { requiresAgeCheck, loading } = useDiscussionAgeGateCheck({
  discussionId: computed(() => props.discussionId),
  enabled: true,
});
</script>

<template>
  <slot v-if="!loading" :requires-age-check="requiresAgeCheck" />
</template>
