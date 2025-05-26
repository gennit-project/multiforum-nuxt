<script setup lang="ts">
  import { ref } from "vue";
  import VueEasyLightbox from "vue-easy-lightbox";

  const props = defineProps({
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      required: false,
      default: "",
    },
    rounded: {
      type: Boolean,
      required: false,
      default: false,
    },
  });

  const visible = ref(false);
  const index = ref(0);
  const images = ref<string[]>([props.src]);

  const handleImageClick = () => {
    visible.value = true;
  };
</script>

<template>
  <div>
    <img
      :alt="alt"
      class="cursor-pointer"
      :class="{ 'rounded-full': rounded }"
      :src="src"
      @click="handleImageClick"
    >
    <vue-easy-lightbox
      v-if="visible"
      :imgs="images"
      :index="index"
      :visible="visible"
      @hide="visible = false"
    />
  </div>
</template>
