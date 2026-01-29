import { gql } from '@apollo/client/core';

export const CREATE_CHANNEL = gql`
  mutation createChannel($createChannelInput: [ChannelCreateInput!]!) {
    createChannels(input: $createChannelInput) {
      channels {
        uniqueName
        description
        channelIconURL
        channelBannerURL
        Admins {
          username
        }
        createdAt
        Tags {
          text
        }
      }
    }
  }
`;

export const UPDATE_CHANNEL = gql`
  mutation updateChannel($where: ChannelWhere, $update: ChannelUpdateInput) {
    updateChannels(where: $where, update: $update) {
      channels {
        uniqueName
        displayName
        description
        channelIconURL
        channelBannerURL
        wikiEnabled
        downloadsEnabled
        allowedFileTypes
        Admins {
          username
        }
        createdAt
        Tags {
          text
        }
        WikiHomePage {
          id
          title
          body
          slug
          createdAt
          updatedAt
          VersionAuthor {
            username
          }
          PastVersions(options: { sort: [{ createdAt: DESC }] }) {
            id
            body
            createdAt
            Author {
              username
            }
          }
        }

        rules
      }
    }
  }
`;

export const CREATE_WIKI_PAGE = gql`
  mutation createWikiPage($where: ChannelWhere!, $update: ChannelUpdateInput!) {
    updateChannels(where: $where, update: $update) {
      channels {
        uniqueName
        wikiEnabled
        WikiHomePage {
          id
          title
          body
          slug
          createdAt
          updatedAt
          VersionAuthor {
            username
          }
          PastVersions(options: { sort: [{ createdAt: DESC }] }) {
            id
            body
            createdAt
            Author {
              username
            }
          }
        }
      }
    }
  }
`;

export const UPDATE_WIKI_PAGE = gql`
  mutation updateWikiPage(
    $where: WikiPageWhere!
    $update: WikiPageUpdateInput!
  ) {
    updateWikiPages(where: $where, update: $update) {
      wikiPages {
        id
        title
        body
        slug
        channelUniqueName
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
      }
    }
  }
`;

export const CREATE_CHILD_WIKI_PAGE = gql`
  mutation createChildWikiPage(
    $where: WikiPageWhere!
    $update: WikiPageUpdateInput!
  ) {
    updateWikiPages(where: $where, update: $update) {
      wikiPages {
        id
        title
        body
        slug
        channelUniqueName
        createdAt
        updatedAt
        VersionAuthor {
          username
        }
        ChildPages {
          id
          title
          body
          slug
          createdAt
          updatedAt
          VersionAuthor {
            username
          }
        }
      }
    }
  }
`;

export const BECOME_CHANNEL_ADMIN = gql`
  mutation becomeChannelAdmin($channelUniqueName: String!) {
    becomeForumAdmin(channelUniqueName: $channelUniqueName)
  }
`;

export const UPDATE_CHANNEL_PLUGIN_PIPELINES = gql`
  mutation UpdateChannelPluginPipelines(
    $channelUniqueName: String!
    $pipelines: [EventPipelineInput!]!
  ) {
    updateChannelPluginPipelines(
      channelUniqueName: $channelUniqueName
      pipelines: $pipelines
    )
  }
`;

export const UPDATE_CHANNEL_ENABLED_PLUGINS = gql`
  mutation UpdateChannelEnabledPlugins(
    $channelUniqueName: String!
    $enabledPlugins: [ChannelEnabledPluginsUpdateFieldInput!]!
  ) {
    updateChannels(
      where: { uniqueName: $channelUniqueName }
      update: { EnabledPlugins: $enabledPlugins }
    ) {
      channels {
        uniqueName
      }
    }
  }
`;
