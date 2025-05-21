import type { ModServerRoleCreateInput } from "../../../../../__generated__/graphql";

const modServerRoles: ModServerRoleCreateInput[] = [
  {
    name: "BasicModRole",
    description: "Intended to be a basic mod role for new users",
    canCloseSupportTickets: false,
    canLockChannel: false,
    canOpenSupportTickets: true,
    canGiveFeedback: true,
    canReport: true,
    canSuspendUser: false,
    canHideComment: false,
    canHideEvent: false,
    canHideDiscussion: false,
  },
  {
    name: "DefaultElevatedModRole",
    description: "A permissive role for trusted mods",
    canCloseSupportTickets: true,
    canOpenSupportTickets: true,
    canReport: true,
    canSuspendUser: true,
    canHideComment: true,
    canHideEvent: true,
    canHideDiscussion: true,
    canGiveFeedback: true,
  },
  {
    name: "DefaultSuspendedModRole",
    description: "A role for suspended mods",
    canCloseSupportTickets: false,
    canOpenSupportTickets: false,
    canReport: false,
    canSuspendUser: false,
    canHideComment: false,
    canHideEvent: false,
    canHideDiscussion: false,
    canGiveFeedback: false,
  },
];

export default modServerRoles;
