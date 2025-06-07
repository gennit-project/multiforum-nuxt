<script setup lang="ts">
import RequireAuth from "@/components/auth/RequireAuth.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { computed } from "vue";

interface Props {
  isSubscribed: boolean;
  loading?: boolean;
  disabled?: boolean;
}

interface Emits {
  toggle: [];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
});

const emit = defineEmits<Emits>();

const baseButtonClasses = "inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200";

const buttonClasses = computed(() => {
  let classes = baseButtonClasses;
  
  if (props.disabled || props.loading) {
    classes += " disabled:opacity-50 disabled:cursor-not-allowed";
  }
  
  if (props.isSubscribed) {
    classes += " text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600";
  }
  
  return classes;
});

const unauthenticatedButtonClasses = baseButtonClasses + " cursor-pointer";

const handleClick = () => {
  if (props.loading || props.disabled) return;
  emit('toggle');
};
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <button
        v-if="!loading"
        :disabled="disabled"
        :class="buttonClasses"
        @click="handleClick"
      >
        <i class="fas fa-bell mr-1.5 text-sm"/>
        {{ isSubscribed ? 'Unsubscribe' : 'Subscribe' }}
      </button>
      <div v-else class="inline-flex items-center px-3 py-1.5">
        <LoadingSpinner class="w-4 h-4 mr-1.5" />
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ isSubscribed ? 'Unsubscribing...' : 'Subscribing...' }}
        </span>
      </div>
    </template>
    <template #does-not-have-auth>
      <button :class="unauthenticatedButtonClasses">
        <i class="fas fa-bell mr-1.5 text-sm"/>
        Subscribe
      </button>
    </template>
  </RequireAuth>
</template>