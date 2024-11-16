import loginWithButtonClick from "./commandFunctions/loginWithButtonClick";
import seedEvents from "./commandFunctions/seed/seedEvents";
import seedUsers from "./commandFunctions/seed/seedUsers";
import seedChannels from "./commandFunctions/seed/seedChannels";
import seedDiscussions from "./commandFunctions/seed/seedDiscussions";
import seedTags from "./commandFunctions/seed/seedTags";
import deleteEvents from "./commandFunctions/delete/deleteEvents";
import deleteEmails from "./commandFunctions/delete/deleteEmails";
import deleteUsers from "./commandFunctions/delete/deleteUsers";
import deleteChannels from "./commandFunctions/delete/deleteChannels";
import deleteTags from "./commandFunctions/delete/deleteTags";
import deleteDiscussions from "./commandFunctions/delete/deleteDiscussions";
import createEvents from "./commandFunctions/createEvents";
import createDiscussions from "./commandFunctions/createDiscussions";
import seedModChannelRoles from "./commandFunctions/seed/rbac/seedModChannelRole";
import seedChannelRoles from "./commandFunctions/seed/rbac/seedChannelRoles";
import seedModServerRoles from "./commandFunctions/seed/rbac/seedModServerRoles";
import seedServerRoles from "./commandFunctions/seed/rbac/seedServerRoles";
import seedServerConfig from "./commandFunctions/seed/rbac/seedServerConfig";

// LOGIN AND AUTH
Cypress.Commands.add("loginWithCreateEventButton", loginWithButtonClick);

// ADDING SEED DATA
Cypress.Commands.add("seedDiscussions", seedDiscussions);
Cypress.Commands.add("seedEvents", seedEvents);
Cypress.Commands.add("seedUsers", seedUsers);
Cypress.Commands.add("seedChannels", seedChannels);
Cypress.Commands.add("seedTags", seedTags);
Cypress.Commands.add("seedModChannelRoles", seedModChannelRoles);
Cypress.Commands.add("seedChannelRoles", seedChannelRoles);
Cypress.Commands.add("seedModServerRoles", seedModServerRoles);
Cypress.Commands.add("seedServerRoles", seedServerRoles);
Cypress.Commands.add("seedServerConfig", seedServerConfig);

// createEvents takes an array of events and creates them
Cypress.Commands.add("createEvents", createEvents);
Cypress.Commands.add("createDiscussions", createDiscussions);

// DELETING SEED DATA
Cypress.Commands.add("deleteEvents", deleteEvents);
Cypress.Commands.add("deleteEmails", deleteEmails);
Cypress.Commands.add("deleteUsers", deleteUsers);
Cypress.Commands.add("deleteChannels", deleteChannels);
Cypress.Commands.add("deleteTags", deleteTags);
Cypress.Commands.add("deleteDiscussions", deleteDiscussions);
