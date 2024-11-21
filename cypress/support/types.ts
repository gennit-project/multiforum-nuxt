import "./commands";
import type { EventCreateInputWithChannels } from "./seedData/events";
import type { DiscussionCreateInputWithChannels } from "./seedData/discussions";
import type { LoginInput } from "../support/commandFunctions/loginWithButtonClick";
/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace Cypress {
    interface Chainable {
      loginWithCreateEventButton(input?: LoginInput): Chainable<Element>;
      seedDiscussions(): Chainable<Element>;
      seedEvents(): Chainable<Element>;
      seedUsers(): Chainable<Element>;
      seedChannels(): Chainable<Element>;
      seedTags(): Chainable<Element>;
      seedModChannelRoles(): Chainable<Element>;
      seedChannelRoles(): Chainable<Element>;
      seedModServerRoles(): Chainable<Element>;
      seedServerRoles(): Chainable<Element>;
      seedServerConfig(): Chainable<Element>;
      createEvents(events: EventCreateInputWithChannels[]): Chainable<Element>;
      createDiscussions(
        discussions: DiscussionCreateInputWithChannels[]
      ): Chainable<Element>;
      loginAsAdmin(): Chainable<Element>;
      authenticatedGraphQL(
        query: string,
        variables?: Record<string, unknown>
      ): Chainable<Cypress.Response<any>>;
      ensureAuth0Login(): Chainable<Element>;
      safetyCheck(): Chainable<Element>;
      dropDataForCypressTests(): Chainable<Element>;
    }
  }
}
