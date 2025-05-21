<script setup lang="ts">
  import { useTheme } from "@/composables/useTheme";

  // Set inheritAttrs to false so we can handle attribute inheritance manually
  defineOptions({
    inheritAttrs: false,
  });

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
        :close-on-content-click="false"
        location="bottom"
        :model-value="props.modelValue"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <template #activator="{ props: activatorProps }">
          <div v-bind="activatorProps">
            <slot
              name="button"
              v-bind="{ ...activatorProps, class: $attrs.class }"
              @close="close"
            />
          </div>
        </template>
        <v-card :theme="theme">
          <slot name="content" />
        </v-card>
      </v-menu>
    </div>
    <template #fallback>
      <slot
        name="button"
        v-bind="{ class: $attrs.class }"
        @close="close"
      />
    </template>
  </client-only>
</template>
