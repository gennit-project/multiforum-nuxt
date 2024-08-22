import { gql } from "@apollo/client/core";

export const GET_SUBREDDIT_SIDEBAR = gql`
  query getSubredditSidebar($subredditName: String!) {
    getSubredditSidebar(subredditName: $subredditName) {
      title
      shortDescription
      longDescription
      displayName
      allowGalleries
      allowImages
      communityIcon
      showMediaPreview
      bannerImg
      allowImages
      linkFlairs {
        text
      }
      rules
    }
  }
`;

export const GET_SUBREDDIT_POSTS = gql`
  query getSubredditPosts(
    $subredditName: String!,
    $options: RedditPostOptions,
    $flair: String
  ) {
    getSubreddit(
      subredditName: $subredditName, 
      options: $options
      flair: $flair
    ) {
      posts {
        id
        title
        createdUTC
        author
        commentCount
        text
        media
        flair
        numCrossposts
        permalink
        thumbnail
        upvoteCount
        url
        preview
        stickied
      }
      after
    }
  }
`;
