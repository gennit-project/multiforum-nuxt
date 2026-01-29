<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import TabButton from '@/components/channel/TabButton.vue';
import PlugIcon from '@/components/icons/PlugIcon.vue';
import LinkIcon from '@/components/icons/LinkIcon.vue';

const route = useRoute();

const isManagementActive = computed(() => {
  return (
    route.path.startsWith('/admin/plugins') &&
    !route.path.startsWith('/admin/plugins/registries')
  );
});

const isRegistriesActive = computed(() => {
  return route.path.startsWith('/admin/plugins/registries');
});
</script>

<template>
  <nav class="mb-4 w-full border-b border-gray-200 dark:border-gray-600">
    <div class="flex space-x-2 px-3 text-sm">
      <TabButton
        to="/admin/plugins"
        label="Plugin Management"
        :is-active="isManagementActive"
      >
        <PlugIcon class="h-5 w-5 shrink-0" />
      </TabButton>
      <TabButton
        to="/admin/plugins/registries"
        label="Registries"
        :is-active="isRegistriesActive"
      >
        <LinkIcon class="h-5 w-5 shrink-0" />
      </TabButton>
    </div>
  </nav>
</template>
