<script setup lang="ts">
import { useRouter } from 'nuxt/app';
import AvatarComponent from '@/components/AvatarComponent.vue';

type ForumItem = {
  uniqueName: string;
  channelIconURL?: string | null;
  timestamp: number;
};

defineProps<{
  forums: ForumItem[];
  linkClasses?: string;
  showHeader?: boolean;
  onNavigate?: () => void;
}>();

const router = useRouter();

const navigateToForum = async (
  forumUniqueName: string,
  onNavigate?: () => void
) => {
  try {
    await router.push({
      name: 'forums-forumId-discussions',
      params: { forumId: forumUniqueName },
    });
    if (onNavigate) {
      onNavigate();
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

const defaultLinkClasses =
  'pl-6 font-semibold group flex items-center gap-x-3 rounded-md py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700';
</script>

<template>
  <div v-if="forums.length > 0">
    <div
      v-if="showHeader"
      class="text-bold mb-2 mt-3 px-6 text-sm uppercase leading-6 text-gray-400 dark:text-gray-100"
    >
      Recent Forums
    </div>
    <nav>
      <ul role="list" class="m-0 p-0">
        <li
          v-for="forum in forums"
          :key="forum.uniqueName"
          class="m-0 list-none"
        >
          <button
            type="button"
            :class="linkClasses || defaultLinkClasses"
            @click="navigateToForum(forum.uniqueName, onNavigate)"
          >
            <AvatarComponent
              class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
              :text="forum.uniqueName || ''"
              :src="forum?.channelIconURL ?? ''"
              :is-small="true"
              :is-square="false"
            />
            {{ forum.uniqueName }}
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
nav li:hover,
.list-item-icon {
  color: #9ca3af;
}
</style>
