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
