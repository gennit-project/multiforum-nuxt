<script lang="ts">
import { defineComponent, ref } from "vue";
import CheckCircleIcon from "../icons/CheckCircleIcon.vue";
import { useAuth0 } from "@auth0/auth0-vue";
import CreateUsernameForm from "./CreateUsernameForm.vue";

export default defineComponent({
  components: {
    CheckCircleIcon,
    CreateUsernameForm
  },
  setup() {
    const { isAuthenticated, user } = useAuth0();
    const newUsername = ref(user.value.nickname);

    return {
      isAuthenticated,
      newUsername,
      user,
      usernameInput: ref(null),
    };
  },
  methods: {
    updateUsername(newUsername: string){
      this.newUsername = newUsername
    }
  }
});
</script>
<template>
  <div class="flex justify-center mx-auto m-8">
    <div class="block w-96">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <CheckCircleIcon
            class="h-6 w-6 text-green-400"
            aria-hidden="true"
          />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Success
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-200">
            Authenticated as <span>{{ user.email }}</span>
          </p>
        </div>
      </div>

      <CreateUsernameForm 
        v-if="user && user.email" 
        :email="user.email"
        @updateUsername="updateUsername"
        @emailAndUserCreated="$emit('emailAndUserCreated')"
      />
    </div>
  </div>
</template>
      