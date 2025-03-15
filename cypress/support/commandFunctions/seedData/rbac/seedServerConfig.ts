import type { ServerConfigCreateInput } from "../../../../../__generated__/graphql";
import { config } from '../../../../../config';

const serverConfigs: ServerConfigCreateInput[] = [
  {
    serverName: config.serverName
  },
];
export default serverConfigs;
