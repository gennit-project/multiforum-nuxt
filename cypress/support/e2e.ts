import './commands';
import { EventCreateInputWithChannels } from './seedData/events';
import { DiscussionCreateInputWithChannels } from './seedData/discussions';
import { LoginInput } from "../support/commandFunctions/loginWithButtonClick";
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
        createEvents(events: EventCreateInputWithChannels[]): Chainable<Element>;
        createDiscussions(discussions: DiscussionCreateInputWithChannels[]): Chainable<Element>;
        deleteEvents(): Chainable<Element>;
        deleteEmails(): Chainable<Element>;
        deleteUsers(): Chainable<Element>;
        deleteChannels(): Chainable<Element>;
        deleteTags(): Chainable<Element>;
        deleteDiscussions(): Chainable<Element>;
      }
    }
  }
  