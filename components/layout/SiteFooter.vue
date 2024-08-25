<script>
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
});
</script>
<template>
  <div>
    <div
      class="flex w-full items-center justify-center gap-2 text-wrap bg-black p-4 text-white"
    >
      <router-link
        :to="`/privacy-policy`"
        class="flex cursor-pointer underline"
      >
        Privacy Policy
      </router-link>

      <router-link
        :to="`/terms-of-use`"
        class="flex cursor-pointer underline"
      >
        Terms of Use
      </router-link>
    </div>
    <div
      class="w-full items-center justify-center text-wrap bg-gray-800 p-4 text-white"
    >
      This project is in alpha. I have hosted it publicly so that others can
      help me test the app. If you have feedback or technical problems, please
      open an issue in the
      <a
        class="ml-1 text-blue-500 underline"
        target="_blank"
        href="https://github.com/gennit-project/multiforum-frontend/issues"
      >GitHub repo</a>, or email me at
      <a
        class="ml-1 text-blue-500"
        href="mailto:gennitdev@gmail.com"
      >gennitdev@gmail.com</a>.
    </div>
  </div>
</template>

<style scoped>
.text-wrap {
  word-wrap: break-word;
}
</style>
