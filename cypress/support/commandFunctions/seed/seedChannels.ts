import channels from "../../seedData/channels";

const seedChannels = () => {
  cy.authenticatedGraphQL(
    `
        mutation CreateChannels($input: [ChannelCreateInput!]!) {
          createChannels(input: $input) {
            channels {
              uniqueName
            }
          }
        }
      `,
    {
      input: channels,
    }
  );
};
export default seedChannels;
