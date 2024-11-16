import type { ServerConfigCreateInput } from "../../../__generated__/graphql";

const serverConfigs: ServerConfigCreateInput[] = [
  {
    serverName: "Cypress Test Server",
    serverIconURL: null,
    serverDescription: null,
    DefaultServerRole: {
      connect: {
        where: {
          node: {
            name: "CanCreateAnything",
          },
        },
      },
    },
    DefaultModRole: {
      connect: {
        where: {
          node: {
            name: "BasicModRole",
          },
        },
      },
    },
    DefaultChannelRole: null,
    DefaultModChannelRole: null,
  },
];

export default serverConfigs;