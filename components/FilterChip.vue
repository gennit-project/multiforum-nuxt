<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';

// Import Popper dynamically to avoid SSR issues with regeneratorRuntime
const Popper = defineAsyncComponent(() => import('vue3-popper'));

withDefaults(defineProps<{
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
                ? 'border-gray-400 ring-1 ring-gray-300 dark:border-slate-500 dark:ring-slate-500'
                : '',
            ]"
            class="align-items flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 px-3.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:text-gray-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-slate-500 dark:focus:ring-slate-500"
            @click="handleClick"
          >
            <slot name="icon" />
            {{ label }}
            <ChevronDownIcon
              class="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
          </button>
        </template>
        <template #content>
          <div class="rounded-lg border border-gray-200 bg-white/95 shadow-lg shadow-black/10 backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/95">
            <slot name="content" />
          </div>
        </template>
      </Popper>
      <template #fallback>
        <button
          :data-testid="dataTestid"
          :class="[
            highlighted
              ? 'border-gray-400 ring-1 ring-gray-300 dark:border-slate-500 dark:ring-slate-500'
              : '',
          ]"
          class="max-height-3 inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 px-3.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors hover:border-gray-300 hover:bg-gray-100 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:text-gray-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:border-slate-500 dark:focus:ring-slate-500"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        </button>
      </template>
    </client-only>
  </div>
</template>
