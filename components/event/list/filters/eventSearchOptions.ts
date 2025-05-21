import type {
  SelectedHourRanges,
  SelectedWeekdays,
  SelectedWeeklyHourRanges,
  SelectedHourRangeObject,
  SelectedWeekdayObject,
  DistanceUnit,
} from "@/types/Event";
import LocationFilterTypes from "./locationFilterTypes";

export const timeShortcutValues = {
  NONE: "NONE",
  TODAY: "TODAY",
  TOMORROW: "TOMORROW",
  THIS_WEEKEND: "THIS_WEEKEND",
  NEXT_WEEK: "NEXT_WEEK",
  NEXT_WEEKEND: "NEXT_WEEKEND",
  THIS_MONTH: "THIS_MONTH",
  NEXT_MONTH: "NEXT_MONTH",
  PAST_EVENTS: "PAST_EVENTS",
};

export const timeFilterShortcuts = [
  {
    label: "Today",
    value: timeShortcutValues.TODAY,
  },
  {
    label: "Tomorrow",
    value: timeShortcutValues.TOMORROW,
  },
  {
    label: "This weekend",
    value: timeShortcutValues.THIS_WEEKEND,
  },
  {
    label: "Next week",
    value: timeShortcutValues.NEXT_WEEK,
  },
  {
    label: "Next weekend",
    value: timeShortcutValues.NEXT_WEEKEND,
  },
  {
    label: "This month",
    value: timeShortcutValues.THIS_MONTH,
  },
  {
    label: "Next month",
    value: timeShortcutValues.NEXT_MONTH,
  },
  {
    label: "Past events",
    value: timeShortcutValues.PAST_EVENTS,
  },
];

export const eventFilterTypeShortcuts = [
  {
    label: "Online events",
    locationFilterType: LocationFilterTypes.ONLY_VIRTUAL,
  },
  {
    label: "In-person events",
    locationFilterType: LocationFilterTypes.ONLY_WITH_ADDRESS,
  },
];

export const weekdays = [
  // Note: Luxon uses 1-7 to mark weekdays instead of 0-6.
  { number: "0", name: "Sunday", shortName: "Sun" },
  { number: "1", name: "Monday", shortName: "Mon" },
  { number: "2", name: "Tuesday", shortName: "Tue" },
  { number: "3", name: "Wednesday", shortName: "Wed" },
  { number: "4", name: "Thursday", shortName: "Thu" },
  { number: "5", name: "Friday", shortName: "Fri" },
  { number: "6", name: "Saturday", shortName: "Sat" },
];

export const hourRangesData = [
  {
    min: 0,
    max: 3,
    "12-hour-label": "12am-3am",
    "24-hour-label": "12:00 to 3:00",
  },
  {
    min: 3,
    max: 6,
    "12-hour-label": "3am-6am",
    "24-hour-label": "3:00 to 6:00",
  },
  {
    min: 6,
    max: 9,
    "12-hour-label": "6am-9am",
    "24-hour-label": "6:00 to 9:00",
  },
  {
    min: 9,
    max: 12,
    "12-hour-label": "9am-12pm",
    "24-hour-label": "9:00 to 12:00",
  },
  {
    min: 12,
    max: 15,
    "12-hour-label": "12pm-3pm",
    "24-hour-label": "12:00 to 15:00",
  },
  {
    min: 15,
    max: 18,
    "12-hour-label": "3pm-6pm",
    "24-hour-label": "15:00 to 18:00",
  },
  {
    min: 18,
    max: 21,
    "12-hour-label": "6pm-9pm",
    "24-hour-label": "18:00 to 21:00",
  },
  {
    min: 21,
    max: 24,
    "12-hour-label": "9pm-12am",
    "24-hour-label": "21:00 to 24:00",
  },
];

export const createDefaultSelectedWeekdays = () => {
  const weekdaysObj = {} as SelectedWeekdays;

  for (let i = 0; i < weekdays.length; i++) {
    const weekday = weekdays[i];
    weekdaysObj[weekday.number] = false;
  }
  return weekdaysObj;
};

export const defaultSelectedWeekdays = createDefaultSelectedWeekdays();

export const createDefaultSelectedHourRanges = () => {
  const ranges = {} as SelectedHourRanges;

  for (let i = 0; i < hourRangesData.length; i++) {
    const label = hourRangesData[i]["12-hour-label"];
    ranges[label] = false;
  }
  return ranges;
};

export const defaultSelectedHourRanges = createDefaultSelectedHourRanges();

export const createDefaultSelectedWeeklyHourRanges = () => {
  const weeklyTimeSlots: SelectedWeeklyHourRanges = {};

  for (let i = 0; i < weekdays.length; i++) {
    const weekday = weekdays[i];
    weeklyTimeSlots[weekday.number] = createDefaultSelectedHourRanges();
  }
  return weeklyTimeSlots;
};

export const defaultSelectedWeeklyHourRanges = createDefaultSelectedWeeklyHourRanges();

const createHourRangesObject = () => {
  // Used as a reference to build graphQL query from selected time slots
  const ranges = {} as SelectedHourRangeObject;

  for (let i = 0; i < hourRangesData.length; i++) {
    const label = hourRangesData[i]["12-hour-label"];
    ranges[label] = hourRangesData[i];
  }
  return ranges;
};

export const hourRangesObject = createHourRangesObject();

const createWeekdayObject = () => {
  // Used as a reference to build graphQL query from selected weekdays
  const dayObj = {} as SelectedWeekdayObject;

  for (let i = 0; i < weekdays.length; i++) {
    const dayData = weekdays[i];
    dayObj[dayData.number] = dayData.name;
  }
  return dayObj;
};

export const weekdayObject = createWeekdayObject();

export const distanceOptionsForMiles: Array<DistanceUnit> = [
  {
    label: "5",
    value: 8.04672, // Miles converted to kilometers for querying the database
  },
  {
    label: "10",
    value: 16.0934,
  },
  {
    label: "20",
    value: 32.1869,
  },
  {
    label: "50",
    value: 80.4672,
  },
  {
    label: "100",
    value: 160.934,
  },
  {
    label: "Any distance",
    value: 0,
  },
];

export const distanceOptionsForKilometers: Array<DistanceUnit> = [
  {
    label: "5",
    value: 5,
  },
  {
    label: "10",
    value: 10,
  },
  {
    label: "20",
    value: 20,
  },
  {
    label: "50",
    value: 50,
  },
  {
    label: "100",
    value: 100,
  },
  {
    label: "Any distance",
    value: 0,
  },
];

export const MilesOrKm = {
  MI: "mi",
  KM: "km",
};

export const distanceUnitOptions: Array<DistanceUnit> = [
  { label: "km", value: "km" },
  { label: "mi", value: "mi" },
];

const createWeekdayMap = () => {
  const weekdayMap = {} as any;
  for (let i = 0; i < weekdays.length; i++) {
    const weekdayData = weekdays[i];
    weekdayMap[weekdayData.number] = weekdayData.name;
  }
  return weekdayMap;
};

export const weekdayMap = createWeekdayMap();

export const resultOrderTypes = {
  CHRONOLOGICAL: "CHRONOLOGICAL",
  REVERSE_CHRONOLOGICAL: "REVERSE_CHRONOLOGICAL",
};
