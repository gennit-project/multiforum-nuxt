import gql from 'graphql-tag';

export const GET_CHANNEL_RULE_GOVERNANCE = gql`
  query GetChannelRuleGovernance(
    $channelUniqueName: String!
    $pluginId: String!
  ) {
    getChannelRuleGovernance(
      channelUniqueName: $channelUniqueName
      pluginId: $pluginId
    ) {
      pluginId
      version
      serverRuleEnforcement
      channelRuleEligibility
      channelRuleAllowlist
      eligible
      ownerEnabled
      canRequest
      pendingRequestId
      pendingRequestNumber
      migrationRequired
    }
  }
`;

export const SET_CHANNEL_RULE_ENFORCEMENT = gql`
  mutation SetChannelRuleEnforcement(
    $channelUniqueName: String!
    $pluginId: String!
    $enabled: Boolean!
  ) {
    setChannelRuleEnforcement(
      channelUniqueName: $channelUniqueName
      pluginId: $pluginId
      enabled: $enabled
    )
  }
`;

export const REQUEST_CHANNEL_RULE_ENFORCEMENT = gql`
  mutation RequestChannelRuleEnforcement(
    $channelUniqueName: String!
    $pluginId: String!
  ) {
    requestChannelRuleEnforcement(
      channelUniqueName: $channelUniqueName
      pluginId: $pluginId
    ) {
      id
      issueNumber
      channelUniqueName
      pluginId
      isOpen
    }
  }
`;

export const GET_PLUGIN_MANAGEMENT_CAPABILITY = gql`
  query GetPluginManagementCapability {
    getPluginManagementCapability
  }
`;
