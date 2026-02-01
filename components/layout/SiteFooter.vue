<script lang="ts" setup>
const links = [
  {
    text: 'Privacy Policy',
    to: '/privacy-policy',
  },
  {
    text: 'Terms of Use',
    to: '/terms-of-use',
  },
  {
    text: 'About',
    to: '/about',
  },
  {
    text: 'Report a Bug',
    to: '/support',
  },
];
</script>
<template>
  <div class="mt-auto w-full">
    <div
      class="flex justify-center gap-2 text-wrap bg-black p-4 text-xs text-white"
    >
      <span class="flex items-center gap-2">
        <nuxt-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex cursor-pointer text-white underline"
        >
          {{ link.text }}
        </nuxt-link>
      </span>
    </div>
    <div class="w-full bg-gray-800 px-8 py-4 text-center text-xs text-white">
      If you have feedback or technical problems, please open an issue in the
      <a
        class="ml-1 text-orange-400 underline"
        target="_blank"
        href="https://github.com/gennit-project/multiforum-nuxt/issues"
        >GitHub repo</a
      >, or email support at
      <a class="ml-1 text-orange-400 underline" href="mailto:gennitdev@gmail.com"
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
