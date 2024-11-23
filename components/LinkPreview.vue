<script>
import { config } from "@/config";
export default {
  name: "LinkPreview",
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      title: "",
      description: "",
      imageUrl: "",
      htmlInferredImages: [],
      apiKey: config.openGraphApiKey,
      showImage: true,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const endpoint = `https://opengraph.io/api/1.1/site/${encodeURIComponent(
        this.url
      )}?app_id=${this.apiKey}`;
      fetch(endpoint)
        .then((response) => response.json())
        .then((data) => {
          this.title = data.hybridGraph.title || data.hybridGraph.url;
          this.description = data.hybridGraph.description || "";
          this.imageUrl = data.hybridGraph.image || "";

          if (data.htmlInferred.images) {
            this.htmlInferredImages = data.htmlInferred.images;
          }
        })
        .catch((error) => console.error(error));
    },
  },
};
</script>

<template>
  <div class="rounded overflow-hidden shadow-lg my-1 border">
    <a
      :href="url"
      target="_blank"
      rel="noopener"
    >
      <img
        v-if="imageUrl && showImage"
        class="w-20 m-4 object-cover"
        :src="imageUrl"
        :alt="title"
        @error="showImage = false"
      >
    </a>
    <div class="px-6 py-4">
      <a
        :href="url"
        target="_blank"
        rel="noopener"
      ><div class="font-bold text-xl mb-2 hover:text-gray-400">{{ title }}</div></a>
      <p
        class="text-gray-700 text-base"
        :class="!showImage ? 'mt-4' : ''"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>
