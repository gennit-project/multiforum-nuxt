<script setup lang="ts">
import { useRouter } from 'nuxt/app';
const router = useRouter();

</script>

<template>
  <button
<<<<<<< HEAD
    class="mt-2 inline-flex items-center rounded p-4 py-1.5 text-xs font-medium text-gray-500 shadow hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    type="button"
    class="
      inline-flex
      items-center
      mt-2
      py-1.5
      text-xs
      font-medium
      rounded
      text-gray-500
       
      p-4
      shadow
      hover:text-gray-800
      focus:outline-none
      focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    "
    @click="router.go(-1)"
  >
    ← Back
  </button>
</template>