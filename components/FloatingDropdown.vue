<script lang="ts">
import { defineComponent, computed } from "vue";
import gql from "graphql-tag";
import { useQuery } from "@vue/apollo-composable";

export default defineComponent({
   props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    return {
      theme
    };
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
  },
});
</script>

<template>
  <div>
    <v-menu 
      :model-value="modelValue"  
      :close-on-content-click="false"
      location="bottom"
      @update:modelValue="$emit('update:modelValue', $event)"
    >
      <template #activator="{ props }">
        <div v-bind="props">
          <slot
            name="button"
            v-bind="props"
            @close="close"
          />
        </div>
      </template>
      <v-card
        :theme="theme"
      > <slot name="content" /></v-card>
    </v-menu>
  </div>
</template>

