import type { ServerConfigCreateInput } from "../../../../__generated__/graphql";

const serverConfigs: ServerConfigCreateInput[] = [
  {
    serverName: "Cypress Test Server",
    serverIconURL: null,
    serverDescription: null,
    DefaultServerRole: {
      connect: {
        where: {
          node: {
            name_EQ: "CanCreateAnything",
          },
        },
      },
    },
    DefaultModRole: {
      connect: {
        where: {
          node: {
            name_EQ: "BasicModRole",
          },
        },
      },
    },
    DefaultChannelRole: null,
    DefaultModChannelRole: null,
  },
];

export default serverConfigs;