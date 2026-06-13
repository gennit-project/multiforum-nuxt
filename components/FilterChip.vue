<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';

// Import Popper dynamically to avoid SSR issues with regeneratorRuntime
const Popper = defineAsyncComponent(() => import('vue3-popper'));

const props = withDefaults(defineProps<{
  dataTestid?: string;
  label?: string;
  highlighted?: boolean;
}>(), {
  dataTestid: 'filter-button',
  label: 'No label',
  highlighted: false,
});

const emit = defineEmits<{
  click: [];
}>();

const isOpen = ref(false);

const handleClick = () => {
  isOpen.value = !isOpen.value;
  emit('click');
};
</script>

<template>
  <div class="align-items flex">
    <client-only>
      <Popper
        v-model="isOpen"
        :close-on-content-click="false"
        location="bottom"
      >
        <template #default>
          <button
            :data-testid="dataTestid"
            :class="[
              highlighted
                ? 'border-gray-500 ring-1 ring-gray-400 dark:border-gray-400 dark:ring-gray-500'
                : '',
            ]"
            class="font-small align-items flex whitespace-nowrap rounded-md border bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:border-gray-400 dark:focus:ring-gray-400"
            @click="handleClick"
          >
            <slot name="icon" />
            {{ label }}
            <ChevronDownIcon
              class="-mr-1 ml-1 mt-0.5 h-3 w-3"
              aria-hidden="true"
            />
          </button>
        </template>
        <template #content>
          <div class="rounded-md border bg-white dark:border-gray-700 dark:bg-gray-900">
            <slot name="content" />
          </div>
        </template>
      </Popper>
      <template #fallback>
        <button
          :data-testid="dataTestid"
          :class="[
            highlighted
              ? 'border-gray-500 ring-1 ring-gray-400 dark:border-gray-400 dark:ring-gray-500'
              : '',
          ]"
          class="max-height-3 font-small mr-2 inline-flex whitespace-nowrap rounded-md border bg-white px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-200 focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:border-gray-400 dark:focus:ring-gray-400"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
            aria-hidden="true"
          />
        </button>
      </template>
    </client-only>
  </div>
</template>
