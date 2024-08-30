<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import type { Event } from "@/src/__generated__/graphql";

export default defineComponent({
  name: "EventBody",
  components: {
    MarkdownPreview,
  },
  props: {
    event: {
      type: Object as PropType<Event>,
      required: true,
    },
  },
  setup(props) {
    return {
      description: props.event.description,
    };
  },
});
</script>
<template>
  <MarkdownPreview
    :text="description || ''"
    :disable-gallery="false"
  />
</template>
