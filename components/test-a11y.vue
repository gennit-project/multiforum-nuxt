<template>
  <div>
    <!-- Missing alt attribute on image -->
<<<<<<< HEAD
    <img
      alt="Logo image"
      src="/logo.png"
    >

    <!-- Missing form label -->
    <label for="test-input">Test input</label>
    <input
      id="test-input"
      type="text"
    >

=======
    <img src="/logo.png" alt="Logo image">
    
    <!-- Missing form label -->
    <label for="test-input">Test input</label>
    <input id="test-input" type="text">
    
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    <!-- Incorrect ARIA attribute -->
    <div id="missing-id">Label</div>
    <div aria-labelledby="missing-id">Correctly labeled attribute</div>
    
    <!-- Element with click handler and keyboard event -->
    <div tabindex="0" @click="doSomething" @keyup.enter="doSomething">Click me</div>
    
    <!-- Empty link with label -->
    <a href="#" aria-label="Empty link" />
  </div>
</template>

<script setup lang="ts">
const doSomething = () => {
  console.log('clicked')
}
</script>