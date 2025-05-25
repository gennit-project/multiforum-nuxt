<template>
  <div>
    <div
      v-if="hasError"
      class="error-boundary"
    >
      <h2>Something went wrong:</h2>
      <pre>{{ errorInfo }}</pre>
      <button @click="retry">Retry</button>
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
  import { ref, onErrorCaptured } from "vue";

  const hasError = ref(false);
  const errorInfo = ref("");

  onErrorCaptured((error, instance, info) => {
    console.error("Vue Error Captured:", error);
    console.error("Component:", instance);
    console.error("Info:", info);
    console.error("Stack:", error.stack);

    hasError.value = true;
    errorInfo.value = `${error.message}\n\nStack: ${error.stack}\n\nInfo: ${info}`;

    return false; // Prevent error from propagating
  });

  const retry = () => {
    hasError.value = false;
    errorInfo.value = "";
  };
</script>
