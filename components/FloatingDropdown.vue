<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";

const { theme } = useTheme();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
  <client-only>
    <div>
      <v-menu
        :model-value="props.modelValue"
        :close-on-content-click="false"
        location="bottom"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <template #activator="{ props: activatorProps }">
          <div v-bind="activatorProps">
            <slot name="button" v-bind="activatorProps" @close="close" />
          </div>
        </template>
        <v-card :theme="theme">
          <slot name="content" />
        </v-card>
      </v-menu>
    </div>
    <template #fallback>
      <slot name="button" @close="close" />
    </template>
  </client-only>
</template>
