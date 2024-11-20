import config from "../../config";
const baseUrl = config.baseUrl;

export const EVENT_CREATION_FORM = `${baseUrl}/events/create`;
export const IN_PERSON_EVENT_LIST = `${baseUrl}/map`;
export const CHANNEL_CREATION_FORM = `${baseUrl}/forums/create`;
export const DISCUSSION_CREATION_FORM = `${baseUrl}/discussions/create`;
export const ONLINE_EVENT_LIST = `${baseUrl}/events/list/search`;
export const DISCUSSION_LIST = `${baseUrl}/discussions/`;

export const getConstantsForCypress = (baseUrl: string) => {
  // Cypress can't use the environment variables in the same way,
  // so we pass the baseUrl as an argument.

  return {
    EVENT_CREATION_FORM: `${baseUrl}/events/create`,
    IN_PERSON_EVENT_LIST: `${baseUrl}/map`,
    CHANNEL_CREATION_FORM: `${baseUrl}/forums/create`,
    DISCUSSION_CREATION_FORM: `${baseUrl}/discussions/create`,
    ONLINE_EVENT_LIST: `${baseUrl}/events/list/search`,
    DISCUSSION_LIST: `${baseUrl}/discussions/`,
  };
};
