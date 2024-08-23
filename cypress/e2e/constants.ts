import config from '../../src/config'
const baseUrl = config.baseUrl

export const EVENT_CREATION_FORM = `${baseUrl}/events/create`;
export const IN_PERSON_EVENT_LIST = `${baseUrl}/map`;
export const CHANNEL_CREATION_FORM = `${baseUrl}/channels/create`;
export const DISCUSSION_CREATION_FORM =
  `${baseUrl}/discussions/create`;
export const ONLINE_EVENT_LIST = `${baseUrl}/events/list/search`;
export const DISCUSSION_LIST = `${baseUrl}/discussions/`;
