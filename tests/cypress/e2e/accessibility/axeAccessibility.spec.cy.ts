import { DISCUSSION_LIST } from '../constants';

describe('Accessibility Tests with axe-core', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphqlRequest');
  });

  it('should have no accessibility violations on the discussion list page', () => {
    cy.visit(DISCUSSION_LIST);
    cy.wait('@graphqlRequest');
    cy.wait(1000); // Allow page to fully render
    cy.injectAxe();
    cy.checkA11y(undefined, {
      includedImpacts: ['critical', 'serious'],
    });
  });

  it('should have no accessibility violations on the discussion list page (all impacts)', () => {
    cy.visit(DISCUSSION_LIST);
    cy.wait('@graphqlRequest');
    cy.wait(1000);
    cy.injectAxe();
    cy.checkA11y();
  });
});
