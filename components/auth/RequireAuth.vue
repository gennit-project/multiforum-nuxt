<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, onMounted } from "vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import { useAuth0 } from "@auth0/auth0-vue";
import LoadingSpinner from "../LoadingSpinner.vue";

export default defineComponent({
  components: {
    LoadingSpinner,
  },
  props: {
    requireOwnership: {
      type: Boolean,
      default: false,
    },
    owners: {
      type: Array as PropType<Array<string>>,
      default: () => [],
    },
    justifyLeft: {
      type: Boolean,
      default: false,
    },
    fullWidth: {
      type: Boolean,
      default: true,
    },
    // This is not whether auth0 is loading. It's whether
    // or not some data is loading in the parent component, for example,
    // an edit form. We don't want to show "you don't have permission" if the
    // data is loading. Therefore use this prop to block that message while loading.
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const {
      loginWithPopup,
      loginWithRedirect,
      isLoading: authLoading,
      isAuthenticated,
      idTokenClaims,
    } = useAuth0();
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const login = async () => {
      if (window.parent.Cypress) {
        await loginWithRedirect();
      } else {
        await loginWithPopup();
      }
      storeToken();
    };

    const storeToken = async () => {
      if (isAuthenticated.value) {
        const token = await idTokenClaims.value.__raw;
        localStorage.setItem("token", token);
      }
    };

    onMounted(() => {
      storeToken();
    });

    return {
      authLoading,
      localUsernameResult,
      login,
    };
  },
  computed: {
    isOwner() {
      for (let i = 0; i < this.owners.length; i++) {
        const owner = this.owners[i];

        if (owner === this.username) {
          return true;
        }
      }
      return false;
    },
    username() {
      if (!this.localUsernameResult) {
        return "";
      }
      const username = this.localUsernameResult.username;

      if (username) {
        return username;
      }
      return "";
    },
  },
});
</script>
<template>
  <LoadingSpinner v-if="loading || authLoading" />
  <div
    v-else
    class="flex align-middle"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div
      v-if="username && (!requireOwnership || isOwner)"
      class="w-full flex justify-center"
    >
      <slot name="has-auth" />
    </div>
    <div
      v-else
      :class="[fullWidth ? 'w-full' : '']"
      @click="login"
    >
      <slot name="does-not-have-auth" />
    </div>
  </div>
</template>
