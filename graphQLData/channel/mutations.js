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
