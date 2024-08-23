import channels from "../../seedData/channels";

const seedChannels = () => {
  const operation = {
    query: `
        mutation CreateChannels($input: [ChannelCreateInput!]!) {
          createChannels(input: $input) {
            channels {
              uniqueName
            }
          }
        }
      `,
    variables: {
      input: channels,
    },
  };

  cy.request({
    url: "http://localhost:4000/graphql",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: operation,
  });
};

export default seedChannels;
