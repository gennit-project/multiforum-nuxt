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
  {
    text: 'Report Harmful or Illegal Content',
    to: '/support?type=content-report',
  },
];
</script>
<template>
  <div class="mt-auto w-full">
    <div
      class="flex flex-wrap justify-center gap-x-4 gap-y-2 bg-black p-4 text-xs text-white"
    >
      <nuxt-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="cursor-pointer whitespace-nowrap text-white underline"
      >
        {{ link.text }}
      </nuxt-link>
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

