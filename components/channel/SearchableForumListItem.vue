<script lang="ts" setup>
  import type { PropType } from "vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";

  type ChannelOption = {
    uniqueName: string;
    displayName: string;
    icon: string;
    description: string;
  };

  defineProps({
    channel: {
      type: Object as () => ChannelOption,
      required: true,
    },
    selected: {
      type: Array as PropType<string[]>,
      required: true,
    },
  });

  const emit = defineEmits(["toggleSelection"]);

  const truncate = (description: string) => {
    return description.length > 100 ? description.substring(0, 100) + "..." : description;
  };
</script>

<template>
  <label class="flex cursor-pointer items-center space-x-3 p-2">
    <input
      :checked="selected.includes(channel.uniqueName)"
      class="h-4 w-4 border border-gray-300 text-orange-600 dark:border-gray-600"
      type="checkbox"
      :value="channel.uniqueName"
      @change="() => emit('toggleSelection', channel.uniqueName)"
    >
    <div class="flex items-center space-x-2">
      <AvatarComponent
        v-if="channel.icon"
        class="z-10 w-10"
        :is-small="true"
        :src="channel.icon"
        :text="channel.uniqueName"
      />
      <AvatarComponent
        v-else
        class="z-10 w-10"
        :is-small="true"
        :text="channel.uniqueName"
      />
      <div class="flex-1 flex-col text-sm">
        <span
          v-if="!channel.displayName"
          class="font-mono font-bold"
          :data-testid="`forum-picker-${channel.uniqueName}`"
        >
          {{ channel.uniqueName }}
        </span>
        <div v-else>
          <span class="font-bold">{{ channel.displayName }}</span>
          &#8226;
          <span
            class="font-mono"
            :data-testid="`forum-picker-${channel.uniqueName}`"
            >{{ channel.uniqueName }}</span
          >
        </div>
        <div>{{ truncate(channel.description || "") }}</div>
      </div>
    </div>
  </label>
</template>
