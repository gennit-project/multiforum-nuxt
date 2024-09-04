<script lang="ts" setup>
import { useAuth0 } from '@/hooks/useAuth0';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import CreateUsernameForm from './CreateUsernameForm.vue';

// Use the Auth0 composable
const { user } = useAuth0();

// Emit function for custom events
const emit = defineEmits(['emailAndUserCreated']);

</script>

<template>
  <div class="flex justify-center mx-auto m-8">
    <div class="block w-96">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <CheckCircleIcon class="h-6 w-6 text-green-400" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Success
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-200">
            Authenticated as <span>{{ user?.email }}</span>
          </p>
        </div>
      </div>

      <CreateUsernameForm
        v-if="user && user.email"
        :email="user.email"
        @email-and-user-created="emit('emailAndUserCreated')"
      />
    </div>
  </div>
</template>

<style scoped></style>
