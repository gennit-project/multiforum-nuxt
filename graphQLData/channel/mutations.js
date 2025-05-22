import { gql } from "@apollo/client/core";

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
        description
        channelIconURL
        channelBannerURL
        wikiEnabled
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

export const DELETE_CHANNEL = gql`
  mutation deleteChannel($url: String!) {
    deleteChannel(filter: { url: { eq: $url } }) {
      channel {
        url
      }
    }
  }
`;

export const ENABLE_CHANNEL_WIKI = gql`
  mutation enableChannelWiki($uniqueName: String!) {
    updateChannels(where: { uniqueName: $uniqueName }, update: { wikiEnabled: true }) {
      channels {
        uniqueName
        wikiEnabled
      }
    }
  }
`;

export const DISABLE_CHANNEL_WIKI = gql`
  mutation disableChannelWiki($uniqueName: String!) {
    updateChannels(where: { uniqueName: $uniqueName }, update: { wikiEnabled: false }) {
      channels {
        uniqueName
        wikiEnabled
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
  mutation updateWikiPage($where: WikiPageWhere!, $update: WikiPageUpdateInput!) {
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
