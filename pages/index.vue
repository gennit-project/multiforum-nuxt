<template>
    <div>
        <h1>Redirecting...</h1>
    </div>
</template>

<script setup lang="ts">
// Redirect the user to /discussions using navigateTo
await navigateTo('/discussions');
</script>