<script lang="ts">
import { defineComponent } from "vue";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";

export default defineComponent({
  name: "TagComponent",
  components: {
    XmarkIcon,
  },
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    index: {
      type: Number,
      default: 0,
    },
    large: {
      type: Boolean,
      default: false,
    },
    hideIcon: {
      type: Boolean,
      default: false,
    },
    tag: {
      type: String,
      required: true,
    },
    channelMode: {
      type: Boolean,
      default: false,
    },
    titleMode: {
      type: Boolean,
      default: false,
    },
    dataTestId: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      highlightedByMouse: false,
    };
  },
  computed: {
    tagClasses() {
      return [
        // large is for time shortcut buttons
        this.large ? "text-md py-1 shadow rounded-full" : "",
        this.titleMode ? "text-xl py-1.5" : "",
        !this.large && !this.titleMode ? "text-sm py-1" : "",
        this.clearable ? "pr-1" : "cursor-pointer pr-2",
        this.getButtonStyles(),
        "pl-1 font-medium tag rounded flex items-center gap-1",
      ];
    },
  },
  methods: {
    handleTagClick(tag: string, active: boolean) {
      if (active) {
        this.$emit("deselect", tag);
      } else {
        this.$emit("select", tag);
      }
    },
    getButtonStyles() {
      if (this.active) {
        return "bg-blue-500 text-white hover:bg-blue-600";
      } else {
        // for the channel buttons
        if (this.channelMode) {
          return "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 dark:hover:text-white";
        }
        // for the tag buttons in the filter components
        return `bg-gray-200 text-gray-600 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 pl-2 dark:hover:bg-gray-400 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-200'`;
      }
    },
  },
});
</script>
<template>
  <span
    :data-testid="dataTestId"
    :class="tagClasses"
    @mouseenter="highlightedByMouse = true"
    @mouseleave="highlightedByMouse = false"
    @click="handleTagClick(tag, active)"
  >
    <Avatar
      v-if="channelMode && !hideIcon"
      :class="[clearable ? 'mr-1' : '', 'h-6 w-6']"
      class="inline-flex"
      :text="tag"
      :src="icon"
      :is-square="true"
    />
    {{ tag }}
    <XmarkIcon
      v-if="clearable"
      data-testid="tag-delete"
      class="mr-1 h-3 w-3 cursor-pointer"
      @click="$emit('delete', index)"
    />
  </span>
</template>

<style scoped>
.tag {
  margin-bottom: 5px;
}
</style>
