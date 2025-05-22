<script lang="ts" setup>
  const links = [
    {
      text: "Privacy Policy",
      to: "/privacy-policy",
    },
    {
      text: "Terms of Use",
      to: "/terms-of-use",
    },
    {
      text: "About",
      to: "/about",
    },
  ];
</script>
<template>
  <div class="mt-auto w-full">
    <div class="flex justify-center gap-2 text-wrap bg-black p-4 text-xs text-white">
      <span class="flex items-center gap-2">
        <nuxt-link
          v-for="link in links"
          :key="link.to"
          class="flex cursor-pointer text-white underline"
          :to="link.to"
        >
          {{ link.text }}
        </nuxt-link>
      </span>
    </div>
    <div class="w-full items-center justify-center text-wrap bg-gray-800 p-4 text-xs text-white">
      If you have feedback or technical problems, please open an issue in the
      <a
        class="text-orange-500 ml-1 underline"
        href="https://github.com/gennit-project/multiforum-nuxt/issues"
        target="_blank"
        >GitHub repo</a
      >, or email support at
      <a
        class="text-orange-500 ml-1"
        href="mailto:gennitdev@gmail.com"
        >gennitdev@gmail.com</a
      >.
    </div>
  </div>
</template>

<style scoped>
  .text-wrap {
    word-wrap: break-word;
  }
</style>
