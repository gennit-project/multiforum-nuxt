import { DateTime, Interval, Duration } from 'luxon';
import { DurationObjectUnits } from 'luxon';

const relativeTime = (dateISO: string) => {
  const dateObj = DateTime.fromISO(dateISO);
  const time = dateObj.toRelative();

  return time;
};

const relativeTimeHoursAndMinutes = (dateISO: string) => {
  const dateObj = DateTime.fromISO(dateISO);
  const time = dateObj.toRelative();

  return time;
};

const durationHoursAndMinutes = (startISO: string, endISO: string) => {
  const startObj = DateTime.fromISO(startISO);
  const endObj = DateTime.fromISO(endISO);
  const lengthOfTime = Interval.fromDateTimes(startObj, endObj)
    .toDuration(["hours", "minutes"])
    .toObject();

  if (lengthOfTime.hours !== undefined) {
    const { hours, minutes } = lengthOfTime;

    if (hours === 0) {
      return `for ${minutes} minutes`;
    }

    if (minutes === 0) {
      if (hours === 1) {
        return "for 1 hour";
      }
      return `for ${hours} hours`;
    }
    if (hours === 1) {
      return `for 1 hour and ${minutes} minutes`;
    }
    return `for ${hours} hours and ${minutes} minutes`;
  }
};

const formatDuration = (eventDurationObj: DurationObjectUnits) => {
  const { hours, minutes } = eventDurationObj;

  if (hours === 0) {
    return `${minutes} minutes`;
  }
  if (hours === 1) {
    if (minutes && minutes > 0) {
      return `1 hour and ${minutes} minutes`;
    }
    return "1 hour";
  }
  if (hours && hours > 1) {
    if (minutes && minutes > 0) {
      return `${hours} hours and ${minutes} minutes`;
    }
    return `${hours} hours`;
  }
};

const formatAbbreviatedDuration = (eventDurationObj: DurationObjectUnits) => {
  const { hours, minutes } = eventDurationObj;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (hours === 1) {
    if (minutes && minutes > 0) {
      return `1h ${minutes}m`;
    }
    return "1h";
  }
  if (hours && hours > 1) {
    if (minutes && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
};

const getDurationObj = (startTime: string, endTime: string) => {
  const startTimeObj = DateTime.fromISO(startTime);
  const endTimeObj = DateTime.fromISO(endTime);
  const interval = Interval.fromDateTimes(startTimeObj, endTimeObj);
  const eventDuration = interval.toDuration(["hours", "minutes"]);
  const eventDurationObj = eventDuration.toObject();
  return eventDurationObj;
};

// This function allows events to be
// sorted in chronological order.
const compareDate = (e1: any, e2: any) => {
  const start1 = DateTime.fromISO(e1);
  const start2 = DateTime.fromISO(e2);
  if (start1 < start2) {
    return -1;
  }
  if (start1 > start2) {
    return 1;
  }
  return 0;
};

const getReadableTimeFromISO = (timeISO: string)=>{
  const timeObject = DateTime.fromISO(timeISO)
  // TIME_SIMPLE yields the time in this format: 1:30 PM
  const humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE)
  return humanReadableTime
}
const convertTimeToReadableFormat = (time: string) => {
  const timeObject = DateTime.fromISO(time)
  const humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE)
  return humanReadableTime;
}

const pluralize = (number: number, word: string) => {
  if (number === 1) {
    return `${number} ${word}`;
  }
  return `${number} ${word}s`;
}

function timeAgo(jsDate: Date) {
  const then = DateTime.fromJSDate(jsDate);
  const now = DateTime.now();
  const diff = now.diff(then);

  if (diff.as('years') >= 1) {
    const number = Math.floor(diff.as('years'))
    return `${pluralize(number, 'year')} ago`;

  } else if (diff.as('months') >= 1) {
    const number = Math.floor(diff.as('months'))
    return `${pluralize(number, 'month')} ago`;

  } else if (diff.as('days') >= 1) {
    const number = Math.floor(diff.as('days'))
    return `${pluralize(number, 'day')} ago`;

  } else if (diff.as('hours') >= 1) {
    const number = Math.floor(diff.as('hours'))
    return `${pluralize(number, 'hour')} ago`;

  } else if (diff.as('minutes') >= 1) {
    const number = Math.floor(diff.as('minutes'))
    return `${pluralize(number, 'minute')} ago`;

  } else {
    return "just now";
  }
}


export {
  compareDate,
  convertTimeToReadableFormat,
  formatDuration,
  formatAbbreviatedDuration,
  relativeTime,
  relativeTimeHoursAndMinutes,
  durationHoursAndMinutes,
  getDurationObj,
  getReadableTimeFromISO,
  timeAgo
};
