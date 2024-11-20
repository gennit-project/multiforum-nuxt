export const deleteServerConfigs = () => {
  cy.authenticatedGraphQL(`
      mutation deleteServerConfigs {
        deleteServerConfigs {
          nodesDeleted
        }
      }
    `);
};

export const deleteServerRoles = () => {
  cy.authenticatedGraphQL(`
      mutation deleteServerRoles {
        deleteServerRoles {
          nodesDeleted
        }
      }
    `);
};

export const deleteModServerRoles = () => {
  cy.authenticatedGraphQL(`
      mutation deleteModServerRoles {
        deleteModServerRoles {
          nodesDeleted
        }
      }
    `);
};

export const deleteChannelRoles = () => {
  cy.authenticatedGraphQL(`
        mutation deleteChannelRoles {
            deleteChannelRoles {
            nodesDeleted
            }
        }
        `);
};

export const deleteModChannelRoles = () => {
  cy.authenticatedGraphQL(`
        mutation deleteModChannelRoles {
            deleteModChannelRoles {
            nodesDeleted
            }
        }
        `);
};
