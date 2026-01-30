import { gql } from '@apollo/client/core';

export const UPDATE_SERVER_CONFIG = gql`
  mutation updateServerConfig(
    $serverName: String!
    $input: ServerConfigUpdateInput
  ) {
    updateServerConfigs(where: { serverName: $serverName }, update: $input) {
      serverConfigs {
        serverName
        serverDescription
        rules
        enableDownloads
        enableEvents
        allowedFileTypes
        pluginRegistries
      }
    }
  }
`;

export const REFRESH_PLUGINS = gql`
  mutation RefreshPlugins {
    refreshPlugins {
      id
      name
      Versions {
        version
      }
    }
  }
`;

export const ALLOW_PLUGIN = gql`
  mutation AllowPlugin($pluginId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      connect: { AllowedPlugins: { where: { node: { id: $pluginId } } } }
    ) {
      serverConfigs {
        serverName
        AllowedPlugins {
          id
          name
        }
      }
    }
  }
`;

export const DISALLOW_PLUGIN = gql`
  mutation DisallowPlugin($pluginId: ID!, $serverName: String!) {
    updateServerConfigs(
      where: { serverName: $serverName }
      disconnect: { AllowedPlugins: { where: { node: { id: $pluginId } } } }
    ) {
      serverConfigs {
        serverName
        AllowedPlugins {
          id
          name
        }
      }
    }
  }
`;

export const INSTALL_PLUGIN_VERSION = gql`
  mutation InstallPluginVersion($pluginId: String!, $version: String!) {
    installPluginVersion(pluginId: $pluginId, version: $version) {
      plugin {
        id
        name
      }
      version
      scope
      enabled
      settingsJson
    }
  }
`;

export const ENABLE_SERVER_PLUGIN = gql`
  mutation EnableServerPlugin(
    $pluginId: String!
    $version: String!
    $enabled: Boolean!
    $settingsJson: JSON
  ) {
    enableServerPlugin(
      pluginId: $pluginId
      version: $version
      enabled: $enabled
      settingsJson: $settingsJson
    ) {
      plugin {
        id
        name
      }
      version
      scope
      enabled
      settingsJson
    }
  }
`;

export const SET_SERVER_PLUGIN_SECRET = gql`
  mutation SetServerPluginSecret(
    $pluginId: String!
    $key: String!
    $value: String!
  ) {
    setServerPluginSecret(pluginId: $pluginId, key: $key, value: $value)
  }
`;

export const UPDATE_MOD_CHANNEL_ROLE = gql`
  mutation UpdateModChannelRole(
    $name: String!
    $input: ModChannelRoleUpdateInput!
  ) {
    updateModChannelRoles(where: { name: $name }, update: $input) {
      modChannelRoles {
        name
        description
        channelUniqueName
        canHideComment
        canHideEvent
        canHideDiscussion
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
    }
  }
`;

export const UPDATE_SERVER_ROLE = gql`
  mutation UpdateServerRole($name: String!, $input: ServerRoleUpdateInput!) {
    updateServerRoles(where: { name: $name }, update: $input) {
      serverRoles {
        name
        description
        canCreateChannel
        canCreateDiscussion
        canCreateEvent
        canCreateComment
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        showAdminTag
      }
    }
  }
`;

export const UPDATE_MOD_SERVER_ROLE = gql`
  mutation UpdateModServerRole(
    $name: String!
    $input: ModServerRoleUpdateInput!
  ) {
    updateModServerRoles(where: { name: $name }, update: $input) {
      modServerRoles {
        name
        description
        canLockChannel
        canHideComment
        canHideEvent
        canHideDiscussion
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
    }
  }
`;

export const UPDATE_PLUGIN_PIPELINES = gql`
  mutation UpdatePluginPipelines($pipelines: [EventPipelineInput!]!) {
    updatePluginPipelines(pipelines: $pipelines)
  }
`;
