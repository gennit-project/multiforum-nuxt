import { TagData } from "@/types/tagTypes";
import { gql } from "@apollo/client/core";
import config from "@/config";
import { DateTime, Interval, Duration } from 'luxon';
import { EventData } from "@/types/Event";

const getTimePieces = (timeObj: DateTime) => {
  const { year, month, day, weekday, hour } = timeObj;

  return {
    startTimeYear: year.toString(),
    startTimeMonth: month.toString(),
    startTimeDayOfMonth: day.toString(),
    startTimeDayOfWeek: weekday.toString(),
    startTimeHourOfDay: hour,
  };
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

const formatDuration = (eventDurationObj: Duration) => {
  const { hours, minutes } = eventDurationObj;

  if (hours === 0) {
    return `${minutes} minutes`;
  }
  if (hours === 1) {
    if (minutes > 0) {
      return `1 hour and ${minutes} minutes`;
    }
    return "1 hour";
  }
  if (hours > 1) {
    if (minutes > 0) {
      return `${hours} hours and ${minutes} minutes`;
    }
    return `${hours} hours`;
  }
};

const getDatePieces = (startTimeObj: any) => {
  const timeOfDay = startTimeObj.toLocaleString(DateTime.TIME_SIMPLE);
  const zone = startTimeObj.zoneName;
  const weekday = startTimeObj.weekdayLong;
  const month = startTimeObj.monthLong;
  const day = startTimeObj.day;
  const year = startTimeObj.year;

  return {
    timeOfDay,
    zone,
    weekday,
    month,
    day,
    year,
  };
};

const formatAbbreviatedDuration = (eventDurationObj: Duration) => {
  const { hours, minutes } = eventDurationObj;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (hours === 1) {
    if (minutes > 0) {
      return `1h ${minutes}m`;
    }
    return "1h";
  }
  if (hours > 1) {
    if (minutes > 0) {
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
const compareDate = (e1: EventData, e2: EventData) => {
  const start1 = DateTime.fromISO(e1.startTime);
  const start2 = DateTime.fromISO(e2.startTime);
  if (start1 < start2) {
    return -1;
  }
  if (start1 > start2) {
    return 1;
  }
  return 0;
};



const relativeTime = (dateISO: string) => {
  const dateObj = DateTime.fromISO(dateISO);
  const time = dateObj.toRelative();

  return time;
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

type UploadFileInput = {
  file: File;
  username: string;
};

type GetEmbeddedLinkInput = {
  signedStorageURL: string;
  filename: string;
  file: File;
  fileType: string;
};

export function getUploadFileName(input: UploadFileInput) {
  const { file, username } = input;
  const filenameWithSpaces = `${Date.now()}-${username}-${file.name}`;
  const withoutSpaces = filenameWithSpaces.replace(/\s/g, '_');
  return withoutSpaces;
}

export function encodeSpacesInURL(url: string) {
  return url.split(" ").join("%20");
}

export async function uploadAndGetEmbeddedLink(input: GetEmbeddedLinkInput) {
  const { 
    signedStorageURL,
    filename, 
    file,
  } = input;

  if (!signedStorageURL) {
    console.error("No signedStorageURL provided");
    return
  }
  const { googleCloudStorageBucket } = config;

  const encodedFilename = encodeURIComponent(filename);

  const embeddedLink = encodeSpacesInURL(
    `https://storage.googleapis.com/${googleCloudStorageBucket}/${encodedFilename}`,
  );
  
  const response = await fetch(signedStorageURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type, // Example "image/png",
    },
  });

  if (!response.ok) {
    console.error("Error uploading file");
  }

  return embeddedLink;
}

export function getDuration(startTime: string, endTime: string) {
  if (DateTime.fromISO(startTime) > DateTime.fromISO(endTime)) {
    return "";
  }
  // Format time as "1h 30m"
  const obj = Interval.fromDateTimes(
    DateTime.fromISO(startTime),
    DateTime.fromISO(endTime),
  )
    .toDuration()
    .shiftTo("days", "hours", "minutes")
    .toObject();

  let timeString = "";
  if (obj.days) {
    timeString += `${obj.days}d `;
  }
  if (obj.hours) {
    timeString += `${obj.hours}h `;
  }
  if (obj.minutes) {
    // convert decimal to int
    timeString += `${Math.floor(obj.minutes)}m`;
  }
  if (timeString === "") {
    timeString = "0m";
  }
  return timeString;
}

export const getTagLabel = (selectedTags: Array<string>) => {
  if (selectedTags.length === 0) {
    return "Tags";
  }
  return `Tags (${selectedTags.length})`;
};

export const getLinksInText = (text: string) => {
  if (!text) {
    return [];
  }
  const matches = text.match(
    /https?:\/\/(?!(?:.*\.(?:jpe?g|gif|png)))[^\s]+/g,
  ) as string[];
  if (matches) {
    return matches;
  }
  return [];
};

export const getChannelLabel = (selectedChannels: Array<string>) => {
  if (selectedChannels.length === 0) {
    return "Forums";
  }
  return `Forums (${selectedChannels.length})`;
};

export const updateTagsInCache = (cache: any, updatedTags: Array<TagData>) => {
  cache.modify({
    fields: {
      tags(existingTagRefs = [], fieldInfo: any) {
        const readField = fieldInfo.readField;

        const tagRefsOnDiscussion = updatedTags.map((tagData: TagData) => {
          return cache.writeFragment({
            data: tagData,
            fragment: gql`
              fragment NewTag on Tags {
                text
              }
            `,
          });
        });

        const newTagRefs = [];

        for (let i = 0; i < tagRefsOnDiscussion.length; i++) {
          const newTagRef = tagRefsOnDiscussion[i];
          const alreadyExists = existingTagRefs.some(
            (ref: any) =>
              readField("text", ref) === readField("text", newTagRef),
          );
          if (!alreadyExists) {
            newTagRefs.push(newTagRef);
          }
        }

        return [...newTagRefs, ...existingTagRefs];
      },
    },
  });
};

export {
    convertTimeToReadableFormat,
    getReadableTimeFromISO,
    timeAgo,
    formatDuration,
    formatAbbreviatedDuration,
    relativeTime,
    relativeTimeHoursAndMinutes,
    durationHoursAndMinutes,
    getDurationObj,
    compareDate,
    getDatePieces,
    getTimePieces
  };