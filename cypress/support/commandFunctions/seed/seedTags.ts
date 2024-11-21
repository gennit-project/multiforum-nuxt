import tags from "../../seedData/tags";

const seedTags = () => {
  cy.authenticatedGraphQL(
    `
        mutation CreateTags($input: [TagCreateInput!]!) {
          createTags(input: $input) {
            tags {
              text
            }
          }
        }
      `,
    {
      input: tags,
    }
  );
};
export default seedTags;
