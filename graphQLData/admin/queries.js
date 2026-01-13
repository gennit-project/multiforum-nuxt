import { gql } from '@apollo/client/core';

export const GET_SERVER_CONFIG = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      serverIconURL
      serverDescription
      DefaultServerRole {
        name
        description
        canCreateComment
        canCreateDiscussion
        canCreateEvent
        canCreateChannel
        canUploadFile
        canUpvoteComment
        canUpvoteDiscussion
      }
      DefaultModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultElevatedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultSuspendedRole {
        name
        description
        canCreateComment
        canCreateDiscussion
        canCreateEvent
        canCreateChannel
        canUploadFile
        canUpvoteComment
        canUpvoteDiscussion
      }
      DefaultSuspendedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      rules
      allowedFileTypes
      enableDownloads
      enableEvents
      pluginRegistries
    }
  }
`;

export const GET_SERVER_PERMISSIONS = gql`
  query getServerConfig($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      DefaultModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultElevatedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultSuspendedModRole {
        name
        description
        canHideComment
        canHideEvent
        canHideDiscussion
        canLockChannel
        canEditComments
        canEditDiscussions
        canEditEvents
        canGiveFeedback
        canOpenSupportTickets
        canCloseSupportTickets
        canReport
        canSuspendUser
      }
      DefaultServerRole {
        name
        description
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        canCreateEvent
        canCreateDiscussion
        canCreateComment
        canCreateChannel
      }
      DefaultSuspendedRole {
        name
        description
        canUpvoteDiscussion
        canUpvoteComment
        canUploadFile
        canGiveFeedback
        canCreateEvent
        canCreateDiscussion
        canCreateComment
        canCreateChannel
      }
    }
  }
`;

export const GET_SERVER_RULES = gql`
  query getServerRules {
    serverConfigs {
      serverName
      rules
    }
  }
`;

export const GET_MOD_CHANNEL_ROLES = gql`
  query GetModChannelRoles {
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
`;

export const GET_PLUGINS = gql`
  query getPlugins($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      AllowedPlugins {
        id
        name
      }
      InstalledVersions {
        id
        version
        repoUrl
        entryPath
      }
    }
  }
`;

export const GET_PLUGIN_BY_ID = gql`
  query getPluginById($serverName: String!, $pluginId: ID!) {
    serverConfigs(where: { serverName: $serverName }) {
      AllowedPlugins(where: { id: $pluginId }) {
        id
        name
      }
      InstalledVersions {
        id
        version
        repoUrl
        entryPath
      }
    }
  }
`;

export const GET_AVAILABLE_PLUGINS = gql`
  query GetPlugins {
    plugins {
      id
      name
      displayName
      description
      authorName
      authorUrl
      homepage
      license
      tags
      Versions {
        id
        version
      }
    }
  }
`;

export const GET_INSTALLED_PLUGINS = gql`
  query GetInstalledPlugins {
    getInstalledPlugins {
      plugin {
        id
        name
        displayName
        description
        authorName
        authorUrl
        homepage
        license
        tags
      }
      version
      scope
      enabled
      settingsJson
      readmeMarkdown
      manifest
      hasUpdate
      latestVersion
      availableVersions
    }
  }
`;

export const GET_SERVER_PLUGIN_SECRETS = gql`
  query GetServerPluginSecrets($pluginId: String!) {
    getServerPluginSecrets(pluginId: $pluginId) {
      key
      status
      lastValidatedAt
      validationError
    }
  }
`;

export const GET_PLUGIN_MANAGEMENT_DATA = gql`
  query GetPluginManagementData($serverName: String!) {
    plugins {
      id
      name
      displayName
      description
      authorName
      authorUrl
      homepage
      license
      tags
      Versions {
        id
        version
        repoUrl
        entryPath
      }
    }
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      pluginRegistries
      AllowedPlugins {
        id
        name
        displayName
        description
        authorName
        authorUrl
        homepage
        license
        tags
      }
      InstalledVersions {
        id
        version
        repoUrl
        entryPath
        Plugin {
          id
          name
          displayName
          description
        }
      }
    }
    getInstalledPlugins {
      plugin {
        id
        name
        displayName
        description
        authorName
        authorUrl
        homepage
        license
        tags
      }
      version
      scope
      enabled
      settingsJson
      readmeMarkdown
      manifest
      hasUpdate
      latestVersion
      availableVersions
    }
  }
`;

export const GET_PLUGIN_DETAIL = gql`
  query GetPluginDetail($pluginId: ID!) {
    plugins(where: { id: $pluginId }) {
      id
      name
      displayName
      description
      authorName
      authorUrl
      homepage
      license
      tags
      Versions {
        id
        version
        repoUrl
        entryPath
        readmeMarkdown
        manifest
      }
    }
  }
`;

export const GET_PIPELINE_RUNS = gql`
  query GetPipelineRuns($targetId: ID!, $targetType: String!) {
    getPipelineRuns(targetId: $targetId, targetType: $targetType) {
      id
      pipelineId
      pluginId
      pluginName
      version
      scope
      channelId
      eventType
      status
      message
      durationMs
      executionOrder
      skippedReason
      payload
      createdAt
      updatedAt
    }
  }
`;

export const GET_PLUGIN_PIPELINES = gql`
  query GetPluginPipelines($serverName: String!) {
    serverConfigs(where: { serverName: $serverName }) {
      serverName
      pluginPipelines
    }
  }
`;
