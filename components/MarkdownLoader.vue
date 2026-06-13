<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'nuxt/app';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import axios from 'axios';

interface Props {
  slug: string;
}

const props = defineProps<Props>();

const route = useRoute();
const content = ref('');

const loadPost = async (slug: string) => {
  try {
    const response = await axios.get(`/${slug}.md`);
    content.value = response.data;
  } catch (error) {
    console.error('Error loading post:', error);
  }
};

watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug) {
      loadPost(newSlug as string);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.slug) {
    loadPost(props.slug as string);
  }
});
</script>

<template>
  <div class="mx-auto flex max-w-5xl px-4 py-12">
    <MarkdownPreview
      :text="content"
      :disable-gallery="true"
      :word-limit="10000"
    />
  </div>
</template>
