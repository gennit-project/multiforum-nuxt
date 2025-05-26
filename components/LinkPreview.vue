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
  <div class="my-1 overflow-hidden rounded border shadow-lg">
    <a
      :href="url"
      rel="noopener"
      target="_blank"
    >
      <img
        v-if="imageUrl && showImage"
        :alt="title"
        class="m-4 w-20 object-cover"
        :src="imageUrl"
        @error="showImage = false"
      >
    </a>
    <div class="px-6 py-4">
      <a
        :href="url"
        rel="noopener"
        target="_blank"
        ><div class="mb-2 text-xl font-bold hover:text-gray-400">{{ title }}</div></a
      >
      <p
        class="text-base text-gray-700"
        :class="!showImage ? 'mt-4' : ''"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>
