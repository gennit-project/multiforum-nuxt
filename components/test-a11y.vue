<template>
  <div>
    <!-- Missing alt attribute on image -->
    <img
      alt="Logo image"
      src="/logo.png"
    />

    <!-- Missing form label -->
    <label for="test-input">Test input</label>
    <input
      id="test-input"
      type="text"
    />

    <!-- Incorrect ARIA attribute -->
    <div id="missing-id">Label</div>
    <div aria-labelledby="missing-id">Correctly labeled attribute</div>

    <!-- Element with click handler and keyboard event -->
    <div
      tabindex="0"
      @click="doSomething"
      @keyup.enter="doSomething"
    >
      Click me
    </div>

    <!-- Empty link with label -->
    <a
      aria-label="Empty link"
      href="#"
    />
  </div>
</template>

<script setup lang="ts">
  const doSomething = () => {
    console.log("clicked");
  };
</script>
