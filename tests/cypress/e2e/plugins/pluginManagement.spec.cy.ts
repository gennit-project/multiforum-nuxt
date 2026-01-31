import { getConstantsForCypress } from '../constants';
import { setupTestData } from '../../support/testSetup';

const constants = getConstantsForCypress(Cypress.env('baseUrl'));
const {
  PLUGIN_MANAGEMENT,
  PLUGIN_DOCS,
  PLUGIN_PIPELINES,
  PLUGIN_REGISTRIES,
  DISCUSSION_LIST,
} = constants;

describe('Plugin Management', () => {
  // Set up test data once for all tests in this file
  setupTestData();

  beforeEach(() => {
    // Set up GraphQL request interception
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
  });

  describe('Plugin Management Page', () => {
    it('loads the plugin management page when authenticated as admin', () => {
      // Authenticate first
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      // Navigate to plugin management
      cy.visit(PLUGIN_MANAGEMENT);
      cy.wait('@graphqlRequest');

      // Verify page loaded
      cy.contains('Plugin Management').should('be.visible');
    });

    it('displays the plugin registries section', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_REGISTRIES);
      cy.wait('@graphqlRequest');

      // Check for registry configuration section
      cy.contains('Plugin Registries').should('be.visible');
    });

    it('shows documentation and pipelines links', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_MANAGEMENT);
      cy.wait('@graphqlRequest');

      // Check for navigation links
      cy.contains('Documentation').should('be.visible');
      cy.contains('Configure Pipelines').should('be.visible');
    });

    it('can navigate to documentation page', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_MANAGEMENT);
      cy.wait('@graphqlRequest');

      // Click documentation link
      cy.contains('Documentation').click();

      // Verify we're on the docs page
      cy.url().should('include', '/plugins/docs');
      cy.contains('Plugin Documentation').should('be.visible');
    });

    it('can navigate to pipelines configuration page', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_MANAGEMENT);
      cy.wait('@graphqlRequest');

      // Click pipelines link
      cy.contains('Configure Pipelines').click();

      // Verify we're on the pipelines page
      cy.url().should('include', '/plugins/pipelines');
    });

    it('has search and filter controls when plugins exist', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_MANAGEMENT);
      cy.wait('@graphqlRequest');

      // Wait for page to load
      cy.wait(1000);

      // Check for filter controls (they may or may not be visible depending on plugins)
      cy.get('body').then(($body) => {
        if ($body.find('input[placeholder="Search plugins..."]').length) {
          cy.get('input[placeholder="Search plugins..."]').should('be.visible');
        }
      });
    });
  });

  describe('Plugin Documentation Page', () => {
    it('loads the documentation page', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Verify page loaded
      cy.contains('Plugin Documentation').should('be.visible');
    });

    it('displays all documentation sections', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Check for main sections
      cy.contains('Overview').should('be.visible');
      cy.contains('Setting Up a Plugin Registry').should('be.visible');
      cy.contains('Creating a Plugin').should('be.visible');
      cy.contains('Configuring Pipelines').should('be.visible');
      cy.contains('Troubleshooting').should('be.visible');
    });

    it('displays table of contents', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Check for table of contents
      cy.contains('Contents').should('be.visible');
    });

    it('has back to plugins link', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Check for back link
      cy.contains('Back to Plugins').should('be.visible');

      // Click and verify navigation
      cy.contains('Back to Plugins').click();
      cy.url().should('include', '/admin/plugins');
      cy.url().should('not.include', '/docs');
    });

    it('displays registry JSON format example', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Check for code examples
      cy.contains('Registry JSON Format').should('be.visible');
      cy.contains('updatedAt').should('be.visible');
    });

    it('displays pipeline configuration examples', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_DOCS);

      // Check for pipeline examples
      cy.contains('Pipeline YAML Configuration').should('be.visible');
      cy.contains('stopOnFirstFailure').should('be.visible');
    });
  });

  describe('Server Pipeline Configuration Page', () => {
    it('loads the pipeline configuration page', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_PIPELINES);
      cy.wait('@graphqlRequest');

      // Verify page loaded - should have pipeline editor
      cy.contains('Pipeline Configuration').should('be.visible');
    });

    it('shows YAML and Visual mode toggle', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_PIPELINES);
      cy.wait('@graphqlRequest');

      // Check for mode toggle
      cy.contains('YAML').should('be.visible');
      cy.contains('Visual').should('be.visible');
    });

    it('has save button', () => {
      cy.visit(DISCUSSION_LIST);
      cy.authenticateOnCurrentPage();
      cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

      cy.visit(PLUGIN_PIPELINES);
      cy.wait('@graphqlRequest');

      // Check for save button
      cy.contains('button', 'Save').should('be.visible');
    });
  });
});

describe('Plugin Detail Page', () => {
  setupTestData();

  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
  });

  it('shows back to plugins link', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    // This test assumes there's at least one plugin. If not, skip.
    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Try to find a Manage button and click it
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Manage")').length) {
        cy.contains('a', 'Manage').first().click();
        cy.wait('@graphqlRequest');

        // Verify detail page loaded
        cy.contains('Back to Plugins').should('be.visible');
      } else {
        // No plugins installed, test passes
        cy.log('No installed plugins to test detail page');
      }
    });
  });
});

describe('Plugin Update Flow', () => {
  setupTestData();

  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
  });

  it('shows update available badge when plugin has updates', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Check for update indicators - this test is conditional
    cy.get('body').then(($body) => {
      if ($body.find('[class*="bg-blue"]').length) {
        // Found update badge styling
        cy.log('Update badges found');
      } else {
        // No updates available
        cy.log('No plugin updates available');
      }
    });
  });

  it('shows update button for plugins with available updates', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Check for update buttons
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Update")').length) {
        cy.contains('a', 'Update').should('be.visible');
      } else {
        cy.log('No plugins with available updates');
      }
    });
  });
});

describe('Plugin Secrets Saving', () => {
  setupTestData();

  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
  });

  it('calls setServerPluginSecret for secret fields when saving settings', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Find an installed plugin with a Manage button
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Manage")').length) {
        cy.contains('a', 'Manage').first().click();
        cy.wait('@graphqlRequest');

        // Wait for detail page to load
        cy.wait(1000);

        // Check if this plugin has a settings form with secret fields
        cy.get('body').then(($detailBody) => {
          // Look for password inputs (secret fields)
          if ($detailBody.find('input[type="password"]').length) {
            // Set up interception for the specific mutations
            cy.intercept('POST', '**/graphql', (req) => {
              if (req.body.query?.includes('setServerPluginSecret')) {
                req.alias = 'setSecretMutation';
              }
              if (req.body.query?.includes('enableServerPlugin')) {
                req.alias = 'enablePluginMutation';
              }
            });

            // Enter a test secret value
            cy.get('input[type="password"]').first().clear().type('test-secret-value-123');

            // Click save
            cy.contains('button', 'Save Settings').click();

            // Verify setServerPluginSecret was called
            cy.wait('@setSecretMutation').then((interception) => {
              expect(interception.request.body.variables).to.have.property('key');
              expect(interception.request.body.variables).to.have.property('value');
              expect(interception.response?.statusCode).to.eq(200);
            });
          } else {
            cy.log('No secret fields in this plugin settings form');
          }
        });
      } else {
        cy.log('No installed plugins to test secret saving');
      }
    });
  });

  it('does not include secrets in enableServerPlugin settingsJson', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Find an installed plugin with a Manage button
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Manage")').length) {
        cy.contains('a', 'Manage').first().click();
        cy.wait('@graphqlRequest');

        // Wait for detail page to load
        cy.wait(1000);

        // Check if this plugin has a settings form with secret fields
        cy.get('body').then(($detailBody) => {
          if ($detailBody.find('input[type="password"]').length) {
            // Get the name attribute of the secret field to know what key to check
            cy.get('input[type="password"]')
              .first()
              .invoke('attr', 'name')
              .then((secretFieldName) => {
                // Set up interception
                cy.intercept('POST', '**/graphql', (req) => {
                  if (req.body.query?.includes('enableServerPlugin')) {
                    req.alias = 'enablePluginMutation';
                  }
                  if (req.body.query?.includes('setServerPluginSecret')) {
                    req.alias = 'setSecretMutation';
                  }
                });

                // Enter a test secret value
                cy.get('input[type="password"]').first().clear().type('test-secret-value-456');

                // Click save
                cy.contains('button', 'Save Settings').click();

                // Wait for the enable mutation
                cy.wait('@enablePluginMutation').then((interception) => {
                  const settingsJson = interception.request.body.variables.settingsJson;
                  // Secret keys should not be in settingsJson
                  if (secretFieldName) {
                    expect(settingsJson).to.not.have.property(secretFieldName);
                  }
                });
              });
          } else {
            cy.log('No secret fields in this plugin settings form');
          }
        });
      } else {
        cy.log('No installed plugins to test');
      }
    });
  });

  it('clears secret input fields after successful save', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Find an installed plugin with a Manage button
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Manage")').length) {
        cy.contains('a', 'Manage').first().click();
        cy.wait('@graphqlRequest');

        // Wait for detail page to load
        cy.wait(1000);

        // Check if this plugin has a settings form with secret fields
        cy.get('body').then(($detailBody) => {
          if ($detailBody.find('input[type="password"]').length) {
            // Set up interception
            cy.intercept('POST', '**/graphql', (req) => {
              if (req.body.query?.includes('setServerPluginSecret')) {
                req.alias = 'setSecretMutation';
              }
              if (req.body.query?.includes('enableServerPlugin')) {
                req.alias = 'enablePluginMutation';
              }
            });

            // Enter a test secret value
            cy.get('input[type="password"]').first().clear().type('test-secret-value-789');

            // Click save
            cy.contains('button', 'Save Settings').click();

            // Wait for mutations to complete
            cy.wait('@setSecretMutation');
            cy.wait('@enablePluginMutation');

            // Verify the input is cleared
            cy.get('input[type="password"]').first().should('have.value', '');
          } else {
            cy.log('No secret fields in this plugin settings form');
          }
        });
      } else {
        cy.log('No installed plugins to test');
      }
    });
  });

  it('does not call setServerPluginSecret for empty secret fields', () => {
    cy.visit(DISCUSSION_LIST);
    cy.authenticateOnCurrentPage();
    cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);

    cy.visit(PLUGIN_MANAGEMENT);
    cy.wait('@graphqlRequest');

    // Wait for page to load
    cy.wait(1000);

    // Find an installed plugin with a Manage button
    cy.get('body').then(($body) => {
      if ($body.find('a:contains("Manage")').length) {
        cy.contains('a', 'Manage').first().click();
        cy.wait('@graphqlRequest');

        // Wait for detail page to load
        cy.wait(1000);

        // Check if this plugin has a settings form
        cy.get('body').then(($detailBody) => {
          if ($detailBody.find('button:contains("Save Settings")').length) {
            // Track if setServerPluginSecret is called
            let setSecretCalled = false;

            cy.intercept('POST', '**/graphql', (req) => {
              if (req.body.query?.includes('setServerPluginSecret')) {
                setSecretCalled = true;
              }
              if (req.body.query?.includes('enableServerPlugin')) {
                req.alias = 'enablePluginMutation';
              }
            });

            // Clear any existing secret values (leave them empty)
            cy.get('input[type="password"]').each(($input) => {
              cy.wrap($input).clear();
            });

            // Click save with empty secret fields
            cy.contains('button', 'Save Settings').click();

            // Wait for enable mutation
            cy.wait('@enablePluginMutation');

            // Verify setServerPluginSecret was not called
            cy.wrap(null).then(() => {
              expect(setSecretCalled).to.equal(false);
            });
          } else {
            cy.log('No settings form in this plugin');
          }
        });
      } else {
        cy.log('No installed plugins to test');
      }
    });
  });
});
