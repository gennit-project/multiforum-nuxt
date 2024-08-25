<script>
import { defineComponent, computed, ref } from "vue";
import { useDisplay } from "vuetify";

export default defineComponent({
  props: {
    count: {
      type: Number,
      default: 0,
    },
    to: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    vertical: {
      type: Boolean,
      default: false,
    },
    showCount: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { smAndDown } = useDisplay();

    const classes = computed(() => {
      let classArray = [];
      if (props.isActive) {
        classArray.push(`border-black dark:border-blue-500 dark:text-gray-100`);

        if (props.vertical) {
          classArray.push(
            "bg-gray-100 dark:bg-gray-700 pr-2 px-4 bg-gray-100 text-gray-700 dark:bg-gray-700 ",
          );
        } else {
          classArray.push(
            "border-b-2 dark:text-gray-400 dark:border-blue-500 dark:text-gray-400",
          );
        }
      } else {
        classArray.push("text-gray-500 border-white dark:border-gray-800");

        if (props.vertical) {
          classArray.push("pr-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700");
        } else {
          classArray.push("border-b-2 border-transparent");
        }
      }

      return classArray;
    });

    return {
      classes,
      smAndDown,
      isHovered: ref(false),
    };
  },
});
</script>

<template>
  <router-link
    :to="to"
    class="border-transparent link font-medium group inline-flex items-center gap-1 hover:text-gray-600 dark:text-gray-400"
    :class="classes"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'px-2 py-4',
        !vertical && isHovered ? 'bg-gray-100 dark:bg-gray-700' : '',
        showCount && count ? '' : 'pr-4',
      ]"
      class="md:my-1 sm:my-1 flex h-6 items-center space-x-2 rounded-lg"
    >
      <div class="text-black dark:text-blue-500">
        <slot />
      </div>
      <span class="text-xs text-gray-700 dark:text-white">{{
        label
      }}</span>
      <span
        v-if="showCount && count !== null"
        class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
      >{{ count }}
      </span>
    </div>
  </router-link>
</template>
<style>
.link.currentPage {
  @apply border-blue-500 text-black;
}
</style>
