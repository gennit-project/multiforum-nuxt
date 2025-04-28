import type { ModChannelRoleCreateInput } from "../../../../../__generated__/graphql";

const modChannelRoles: ModChannelRoleCreateInput[] = [
  {
    name: "BasicModChannelRole",
    description: "Intended to be a basic mod role for new users",
    channelUniqueName: "cats",
    canReport: true,
    canCloseSupportTickets: false,
    canGiveFeedback: true,
    canHideComment: false,
    canHideDiscussion: false,
    canHideEvent: false,
    canOpenSupportTickets: true,
  },
  {
    name: "AdvancedModChannelRole",
    description: "Intended to be an advanced mod role for experienced users",
    channelUniqueName: "cats",
    canReport: true,
    canCloseSupportTickets: true,
    canGiveFeedback: true,
    canHideComment: true,
    canHideDiscussion: true,
    canHideEvent: true,
    canOpenSupportTickets: true,
  },
];



export default modChannelRoles;
