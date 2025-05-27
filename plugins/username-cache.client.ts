// plugins/username-cache.client.ts
import { defineNuxtPlugin } from "nuxt/app";
import { setUsername } from "@/cache";

export default defineNuxtPlugin(() => {
  // This plugin runs only on the client
  if (typeof window !== 'undefined') {
    // Try to load username from localStorage
    const storedUsername = localStorage.getItem('username');
    
    if (storedUsername) {
      // Set the username in the reactive state
      setUsername(storedUsername);
      console.log("Loaded username from local storage:", storedUsername);
    }
  }
});