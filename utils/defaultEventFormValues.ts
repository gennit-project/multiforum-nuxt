import { DateTime } from "luxon";
import type { CreateEditEventFormValues } from "@/types/Event";

const now = DateTime.now();
const defaultStartTimeObj = now.startOf("hour").plus({ hours: 1 });
const defaultStartTimeISO = defaultStartTimeObj.toISO();

function getDefaultEventFormValues(channelId: string): CreateEditEventFormValues {
  return {
    title: "",
    description: "",
    selectedTags: [],
    selectedChannels: channelId ? [channelId] : [],
    address: "",
    latitude: 0,
    longitude: 0,
    locationName: "",
    isAllDay: false,
    isHostedByOP: false,
    isInPrivateResidence: false,
    virtualEventUrl: "",
    startTime: defaultStartTimeISO || "",
    startTimeDayOfWeek: "",
    startTimeHourOfDay: 0,
    endTime: defaultStartTimeISO ? (DateTime.fromISO(defaultStartTimeISO).plus({ hours: 2 }).toISO() || '') : "",
    canceled: false,
    deleted: false,
    free: false,
    cost: "",
  }
}

export default getDefaultEventFormValues;