import channels from '../support/commandFunctions/seedData/seedChannels';
import discussions from '../support/commandFunctions/seedData/seedDiscussions';
import events from '../support/commandFunctions/seedData/seedEvents';
import tags from '../support/commandFunctions/seedData/seedTags';
import channelRoles from '../support/commandFunctions/seedData/rbac/seedChannelRoles';
import modChannelRoles from '../support/commandFunctions/seedData/rbac/seedModChannelRoles';
import serverRoles from '../support/commandFunctions/seedData/rbac/seedServerRoles';
import modServerRoles from '../support/commandFunctions/seedData/rbac/seedModServerRoles';
import serverConfigs from '../support/commandFunctions/seedData/rbac/seedServerConfig';
import users from '../support/commandFunctions/seedData/seedUsers';

export const deleteAll = () => {
  cy.loginAsAdmin();
  cy.dropDataForCypressTests().then((response) =>
    validateResponse(response, 'dropDataForCypressTests')
  );
};

// Helper function to validate the response
const validateResponse = (response: any, commandName: string) => {
  if (
    !response ||
    response.status >= 400 ||
    (response.body && response.body.errors)
  ) {
    const errorDetails =
      response.body?.errors
        ?.map((error: any) => {
          return `Message: ${error.message}, Path: ${JSON.stringify(error.path)}, Extensions: ${JSON.stringify(error.extensions)}`;
        })
        .join('\n') || 'No detailed error available';

    cy.log(`Error in ${commandName}: ${errorDetails}`);
    throw new Error(`${commandName} failed with errors: ${errorDetails}`);
  }

  cy.log(`${commandName} succeeded`);
};

export const seedAll = () => {
  // The order is important here because some
  // have a dependency on the previous seed data.

  const attemptSeed = (attempt = 1) => {
    return cy
      .seedDataForCypressTests({
        channels,
        comments: [], // May add some seed comments later if needed.
        discussions,
        events,
        tags,
        users,
        channelRoles,
        modChannelRoles,
        serverRoles,
        modServerRoles,
        serverConfigs,
      })
      .then((response) => {
        const hasConstraintError = Boolean(
          response?.body?.errors?.some((err: any) =>
            (err?.message || '').includes('Constraint validation failed')
          )
        );

        // Sometimes Neo4j leaves constraint debris if the drop mutation races;
        // a quick re-drop and retry usually clears it.
        if (hasConstraintError && attempt < 2) {
          cy.log(
            'Constraint validation hit during seed; retrying after re-drop (attempt 2)'
          );
          deleteAll();
          return attemptSeed(attempt + 1);
        }

        return validateResponse(response, 'seedDataForCypressTests');
      });
  };

  return attemptSeed();
};
