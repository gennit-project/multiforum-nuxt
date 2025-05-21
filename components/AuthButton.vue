<script setup>
  import RequireAuth from "@/components/auth/RequireAuth.vue";

  const props = defineProps({
    props: {
      type: Object,
      default: () => ({}),
    },
    testId: {
      type: String,
      default: "",
    },
    buttonClasses: {
      type: String,
      default: "",
    },
    loading: Boolean,
    showCount: Boolean,
    count: {
      type: Number,
      default: 0,
    },
  });

  defineEmits(["click"]);
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <button
        v-bind="props"
        :class="buttonClasses"
        :data-testid="testId"
        @click="$emit('click')"
      >
        <ButtonContent
          :count="count"
          :loading="loading"
          :show-count="showCount"
        >
          <slot />
        </ButtonContent>
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        v-bind="props"
        :class="buttonClasses"
        :data-testid="testId"
      >
        <ButtonContent
          :count="count"
          :loading="false"
          :show-count="showCount"
        >
          <slot />
        </ButtonContent>
      </button>
    </template>
  </RequireAuth>
</template>
