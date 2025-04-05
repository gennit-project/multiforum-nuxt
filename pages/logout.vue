<script setup>
import { useRouter } from "nuxt/app";
import { onMounted, ref } from "vue";
import { setIsAuthenticated, setUsername } from "@/cache";

const router = useRouter();
const error = ref(false);
const message = ref("Logging out...");

onMounted(() => {
  try {
    console.log("Logout page mounted");
    
    // Reset authentication state
    setIsAuthenticated(false);
    setUsername("");
    
    // Clear auth tokens
    if (localStorage) {
      localStorage.removeItem("token");
      console.log("Token removed");
      
      // Get redirect path
      const postLogoutRedirect = localStorage.getItem("postLogoutRedirect") || "/";
      console.log("Redirecting to:", postLogoutRedirect);
      
      // Clear the stored path
      localStorage.removeItem("postLogoutRedirect");
      
      // Clear any Auth0 storage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('auth0')) {
          localStorage.removeItem(key);
        }
      });
      
      // Redirect after a short delay to ensure state updates
      setTimeout(() => {
        router.push(postLogoutRedirect);
      }, 500);
    } else {
      console.error("localStorage not available");
      message.value = "Error during logout. Redirecting to home...";
      error.value = true;
      
      // Fallback redirect
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  } catch (e) {
    console.error("Error in logout page:", e);
    message.value = "Error during logout. Redirecting to home...";
    error.value = true;
    
    // Fallback redirect
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }
});
</script>

<template>
  <NuxtLayout>
    <div class="flex items-center justify-center h-screen">
      <div class="text-center p-8 rounded-lg" :class="{ 'bg-red-100 dark:bg-red-900': error }">
        <h1 class="text-xl mb-4 dark:text-white">{{ message }}</h1>
        <div v-if="error" class="text-sm text-gray-600 dark:text-gray-300">
          You'll be redirected automatically.
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
