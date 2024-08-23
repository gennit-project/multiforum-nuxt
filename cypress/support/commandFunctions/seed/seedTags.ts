import tags from "../../seedData/tags";

const seedTags = () => {
  const operation = {
    query: `
        mutation CreateTags($input: [TagCreateInput!]!) {
          createTags(input: $input) {
            tags {
              text
            }
          }
        }
      `,
    variables: {
      input: tags,
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

export default seedTags;
