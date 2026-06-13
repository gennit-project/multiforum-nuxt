<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { config } from '@/config';

const props = defineProps<{
  url: string;
}>();

const title = ref('');
const description = ref('');
const imageUrl = ref('');
const htmlInferredImages = ref<string[]>([]);
const showImage = ref(true);
const apiKey = config.openGraphApiKey;

interface OpenGraphResponse {
  hybridGraph: {
    title?: string;
    url?: string;
    description?: string;
    image?: string;
  };
  htmlInferred: {
    images?: string[];
  };
}

const fetchData = () => {
  const endpoint = `https://opengraph.io/api/1.1/site/${encodeURIComponent(
    props.url
  )}?app_id=${apiKey}`;
  fetch(endpoint)
    .then((response) => response.json())
    .then((data: OpenGraphResponse) => {
      title.value = data.hybridGraph.title || data.hybridGraph.url || '';
      description.value = data.hybridGraph.description || '';
      imageUrl.value = data.hybridGraph.image || '';

      if (data.htmlInferred.images) {
        htmlInferredImages.value = data.htmlInferred.images;
      }
    })
    .catch((error) => console.error(error));
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="my-1 overflow-hidden rounded border shadow-lg">
    <a :href="url" target="_blank" rel="noopener">
      <img
        v-if="imageUrl && showImage"
        class="m-4 w-20 object-cover"
        :src="imageUrl"
        :alt="title"
        @error="showImage = false"
      >
    </a>
    <div class="px-6 py-4">
      <a :href="url" target="_blank" rel="noopener"
        ><div class="mb-2 text-xl font-bold hover:text-gray-400">
          {{ title }}
        </div></a
      >
      <p class="text-base text-gray-700" :class="!showImage ? 'mt-4' : ''">
        {{ description }}
      </p>
    </div>
  </div>
</template>
