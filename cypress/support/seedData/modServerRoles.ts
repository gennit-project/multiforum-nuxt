import type { ModServerRoleCreateInput } from "../../../__generated__/graphql";

const serveConfigs: ModServerRoleCreateInput[] = [
  {
    name: "BasicModRole",
    description: "Intended to be a basic mod role for new users",
    canCloseSupportTickets: false,
    canLockChannel: false,
    canOpenSupportTickets: true,
    canGiveFeedback: true,
  },
  {
    name: "AdvancedModRole",
    description: "Intended to be an advanced mod role for experienced users",
    canCloseSupportTickets: true,
    canLockChannel: true,
    canOpenSupportTickets: true,
    canGiveFeedback: true,
  }
];

export default serveConfigs;
