<script setup lang="ts">
import { computed } from "vue";
import gql from "graphql-tag";
import { useQuery } from "@vue/apollo-composable";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const GET_THEME = gql`
  query getTheme {
    theme @client
  }
`;

const { result: themeResult, loading: themeLoading, error: themeError } = useQuery(GET_THEME);

const theme = computed(() => {
  if (themeLoading.value || themeError.value) {
    return "";
  }
  return themeResult.value?.theme;
});

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
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
</template>
