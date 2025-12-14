<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useRoute } from 'nuxt/app';
import LeftArrowIcon from '@/components/icons/LeftArrowIcon.vue';

export default defineComponent({
  name: 'BackLink',
  components: {
    LeftArrowIcon,
  },
  props: {
    link: {
      type: String,
      default: '',
    },
    dataTestid: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: 'Back',
    },
  },
  setup(props) {
    const route = useRoute();

    const channelId = computed(() => {
      const id = route.params.forumId ?? route.params.channelId;
      return typeof id === 'string' ? id : '';
    });

    const linkText = computed(() => {
      if (channelId.value) {
        return `Back to ${channelId.value}`;
      }
      return props.text;
    });

    return {
      linkText,
    };
  },
});
</script>

<template>
  <nuxt-link
    :to="link"
    :data-testid="dataTestid"
    class="border-gray-3 inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
  >
    <LeftArrowIcon class="h-4 w-4" />
    <span v-if="linkText">{{ linkText }}</span>
  </nuxt-link>
</template>
