<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import TabButton from "@/components/channel/TabButton.vue";
import { useDisplay } from "vuetify/lib/framework.mjs";
import { useRoute } from "vue-router";
import { User } from "@/__generated__/graphql"
import { useAuth0 } from "@auth0/auth0-vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";

type TabData = {
  name: string;
  href: string;
  current: boolean;
  count?: number | null;
}

export default defineComponent({
  name: "ChannelTabs",
  components: {
    TabButton,
  },
  props: {
    route: {
      type: Object,
      required: true,
    },
    vertical: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object as () => User,
      required: true,
    },
    showCounts: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const channelId = ref(props.route.params.channelId);
    const { isAuthenticated } = useAuth0();
    
    const { mdAndDown } = useDisplay();
    const route = useRoute();

    const usernameInParams = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    watch(
      () => props.route,
      (to) => {
        channelId.value = to.params.channelId;
      },
    );

    const { result } = useQuery(GET_LOCAL_USERNAME);
    const username = computed(() => {
      let username = result.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const tabs = computed(() => {
      let tabList: TabData[] = [
        { 
          name: "Comments", 
          href: `/u/${usernameInParams.value}`, 
          current: true,
          count: props.user?.CommentsAggregate?.count,
        },
        { name: 
          "Discussions", 
          href: `/u/${usernameInParams.value}/discussions`, 
          current: false,
          count: props.user?.DiscussionsAggregate?.count,
        },
        { 
          name: "Events", 
          href: `/u/${usernameInParams.value}/events`, 
          current: false,
          count: props.user?.EventsAggregate?.count,
        },
        
      ]

      if (isAuthenticated && username.value === usernameInParams.value) {
        tabList.push({
          name: "Settings",
          href: `/u/${usernameInParams.value}/settings`,
          current: false,
          count: null
        })
      }
      return tabList
    })

    return {
      channelId,
      mdAndDown,
      tabs,
      username: usernameInParams,
    };
  },
  data() {
    return {
      selectedTab: "about",
    };
  },
  methods: {
    redirect(e: any): void {
      const selectedTab = e.target.value;
      this.$router.push(this.tabRoutes[selectedTab]);
    },
  },
});
</script>
>

<template>
  <div>
    <nav
      v-if="vertical"
      class="text-md flex max-w-7xl flex-col"
      aria-label="Tabs"
    >
      q
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.href"
        :label="tab.name"
        :is-active="route.name.includes(tab.name)"
        :vertical="true"
        :count="tab.count"
        :show-count="showCounts && !!tab.count"
      />
    </nav>
    <nav
      v-else
      class="max-w-7xl space-x-2 pt-1 text-sm"
      aria-label="Tabs"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.href"
        :label="tab.name"
        :is-active="route.name.includes(tab.name)"
        :count="tab.count"
        :show-count="showCounts && !!tab.count"
      />
    </nav>
  </div>
</template>
