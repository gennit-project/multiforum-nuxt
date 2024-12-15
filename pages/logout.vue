<script setup>
import { useRouter } from "nuxt/app";
import { onMounted } from "vue";

const router = useRouter();

onMounted(() => {
  // Retrieve the original page the user was on
  const postLogoutRedirect = localStorage.getItem("postLogoutRedirect") || "/";
  // Clear the stored path and navigate back
  localStorage.removeItem("postLogoutRedirect");
  router.push(postLogoutRedirect);
});
</script>

<template>
  <div>Logging out...</div>
</template>
