<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    classes?: string | string[];
    text?: string;
    searchInput?: string;
  }>(),
  {
    classes: '',
    text: '',
    searchInput: '',
  },
);

const parts = computed(() => {
  let p = [props.text];
  if (props.searchInput) {
    p = props.text.split(new RegExp(`(${props.searchInput})`, 'gi'));
  }
  return p;
});

function match(part: string, searchInput: string) {
  if (!part) {
    return false;
  }
  return part.toLowerCase() === searchInput.toLowerCase();
}
</script>
<template>
  <span v-for="(part, i) in parts" :key="i" :class="classes">
    <mark v-if="match(part, searchInput)">
      {{ part }}
    </mark>
    <span v-else>{{ part }}</span>
  </span>
</template>
