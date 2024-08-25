<script lang="ts">
import { defineComponent } from "vue";
import RequireAuth from "../../auth/RequireAuth.vue";
import LoadingSpinner from "../LoadingSpinner.vue";

export default defineComponent({
  name: "VoteButton",
  components: {
    LoadingSpinner,
    RequireAuth,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    count: {
      type: Number,
      default: 0,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    showCount: {
      type: Boolean,
      default: true,
    },
    testId: {
      type: String,
      default: "",
    },
    tooltipText: {
      type: String,
      default: "",
    },
    tooltipUnicode: {
      type: String,
      default: "",
    },
  },
  setup() {
    return {};
  },
});
</script>
<template>
  <v-tooltip v-if="tooltipText" location="top" content-class="custom-tooltip">
    <template #activator="{ props }">
      <RequireAuth :full-width="false">
        <template #has-auth>
          <button
            v-bind="props"
            :data-testid="testId"
            class="inline-flex max-h-6 cursor-pointer items-center rounded-full border px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500"
            :class="[
              active
                ? 'border-blue-500 bg-blue-100 text-black dark:border-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600'
                : ' border-gray-100 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700  dark:hover:bg-gray-700',
            ]"
            @click="$emit('vote')"
          >
            <span v-if="!loading" class="justify-center">
              <slot />
            </span>
            <span v-if="loading" class="justify-center">
              <LoadingSpinner />
            </span>
            <span v-if="showCount" class="mx-1 justify-center text-xs">{{
              count
            }}</span>
          </button>
        </template>
        <template #does-not-have-auth>
          <button
            v-bind="props"
            :data-testid="testId"
            class="inline-flex max-h-6 cursor-pointer items-center rounded-full border px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500"
            :class="[
              active
                ? 'border-blue-500 bg-blue-100 text-black dark:border-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600'
                : ' border-gray-100 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700  dark:hover:bg-gray-700',
            ]"
          >
            <span class="justify-center">
              <slot />
            </span>
            <span v-if="showCount" class="mx-1 justify-center text-xs">{{
              count
            }}</span>
          </button>
        </template>
      </RequireAuth>
    </template>
    <template #default>
      <div v-if="tooltipUnicode" class="flex h-16 justify-center text-6xl">
        {{ tooltipUnicode }}
      </div>
      <p class="min-w-sm text-sm">
        {{ tooltipText }}
      </p>
    </template>
  </v-tooltip>
  <RequireAuth 
    v-else 
    :full-width="false"
  >
    <template #has-auth>
      <button
        :data-testid="testId"
        class="inline-flex max-h-6 cursor-pointer items-center rounded-full border px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500"
        :class="[
          active
            ? 'border-blue-500 bg-blue-100 text-black dark:border-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600'
            : ' border-gray-100 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700  dark:hover:bg-gray-700',
        ]"
        @click="$emit('vote')"
      >
        <span v-if="!loading" class="justify-center">
          <slot />
        </span>
        <span v-if="loading" class="justify-center">
          <LoadingSpinner />
        </span>
        <span v-if="showCount" class="mx-1 justify-center text-xs">{{
          count
        }}</span>
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        :data-testid="testId"
        class="inline-flex max-h-6 cursor-pointer items-center rounded-full border px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500"
        :class="[
          active
            ? 'border-blue-500 bg-blue-100 text-black dark:border-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600'
            : ' border-gray-100 bg-gray-100 hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700  dark:hover:bg-gray-700',
        ]"
      >
        <span class="justify-center">
          <slot />
        </span>
        <span v-if="showCount" class="mx-1 justify-center text-xs">{{
          count
        }}</span>
      </button>
    </template>
  </RequireAuth>
</template>

<style scoped></style>
