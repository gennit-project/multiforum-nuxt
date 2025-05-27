import { gql } from "@apollo/client/core";
import { config } from "@/config";
import type { Duration } from "luxon";
import { DateTime, Interval } from "luxon";
import LinkIcon from '@/components/icons/LinkIcon.vue'
import FlagIcon from '@/components/icons/FlagIcon.vue'
import HandThumbDownIcon from '@/components/icons/HandThumbDownIcon.vue'
import EyeIcon from '@/components/icons/EyeIcon.vue'
import PencilIcon from '@/components/icons/PencilIcon.vue'
import TrashIcon from '@/components/icons/TrashIcon.vue'
import XmarkIcon from '@/components/icons/XmarkIcon.vue'
import ArchiveBox from "@/components/icons/ArchiveBox.vue";
import UnarchiveBox from "@/components/icons/UnarchiveBox.vue";
import UserPlus from "@/components/icons/UserPlus.vue";
import UserMinus from "@/components/icons/UserMinus.vue";
import type { Event, Tag as TagData } from "@/__generated__/graphql"
import ImageIcon from "@/components/icons/ImageIcon.vue";

const MAX_FILE_SIZE_MB = 5;
const MAX_PROFILE_PIC_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
const MAX_PROFILE_PIC_SIZE_BYTES = MAX_PROFILE_PIC_SIZE_MB * 1024 * 1024; // Convert MB to bytes

type FileSizeValidationInput = {
  file: File;
  isProfilePic?: boolean;
};

export function isFileSizeValid(input: FileSizeValidationInput): { valid: boolean; message: string } {
  const { file, isProfilePic = false } = input;
  const maxSize = isProfilePic ? MAX_PROFILE_PIC_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxSizeMB = isProfilePic ? MAX_PROFILE_PIC_SIZE_MB : MAX_FILE_SIZE_MB;
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File size must be less than ${maxSizeMB}MB. Current file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
    };
  }
  return { valid: true, message: '' };
}

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
const compareDate = (e1: Event, e2: Event) => {
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

const getReadableTimeFromISO = (timeISO: string) => {
  const timeObject = DateTime.fromISO(timeISO);
  // TIME_SIMPLE yields the time in this format: 1:30 PM
  const humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE);
  return humanReadableTime;
};
const convertTimeToReadableFormat = (time: string) => {
  const timeObject = DateTime.fromISO(time);
  const humanReadableTime = timeObject.toLocaleString(DateTime.TIME_SIMPLE);
  return humanReadableTime;
};

const pluralize = (number: number, word: string) => {
  if (number === 1) {
    return `${number} ${word}`;
  }
  return `${number} ${word}s`;
};

function timeAgo(jsDate: Date) {
  // Throw an error if the input is not a Date object
  if (!(jsDate instanceof Date)) {
    throw new Error("Input must be a Date object");
  }
  const then = DateTime.fromJSDate(jsDate);
  const now = DateTime.now();
  const diff = now.diff(then);

  if (diff.as("years") >= 1) {
    const number = Math.floor(diff.as("years"));
    return `${pluralize(number, "year")} ago`;
  } else if (diff.as("months") >= 1) {
    const number = Math.floor(diff.as("months"));
    return `${pluralize(number, "month")} ago`;
  } else if (diff.as("days") >= 1) {
    const number = Math.floor(diff.as("days"));
    return `${pluralize(number, "day")} ago`;
  } else if (diff.as("hours") >= 1) {
    const number = Math.floor(diff.as("hours"));
    return `${pluralize(number, "hour")} ago`;
  } else if (diff.as("minutes") >= 1) {
    const number = Math.floor(diff.as("minutes"));
    return `${pluralize(number, "minute")} ago`;
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
  const withoutSpaces = filenameWithSpaces.replace(/\s/g, "_");
  return withoutSpaces;
}

export function encodeSpacesInURL(url: string) {
  return url.split(" ").join("%20");
}

export async function uploadAndGetEmbeddedLink(input: GetEmbeddedLinkInput) {
  const { signedStorageURL, filename, file } = input;
  
  // Log debug info
  console.log('File info:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  // Check validation
  const sizeCheck = isFileSizeValid({ file });
  if (!sizeCheck.valid) {
    console.error(sizeCheck.message);
    throw new Error(sizeCheck.message);
  }
  
  if (!signedStorageURL) {
    console.error("No signedStorageURL provided");
    return;
  }
  
  const { googleCloudStorageBucket } = config;
  const encodedFilename = encodeURIComponent(filename);
  const embeddedLink = encodeSpacesInURL(
    `https://storage.googleapis.com/${googleCloudStorageBucket}/${encodedFilename}`
  );

<<<<<<< HEAD
  // Set the content type based on the file type or extension
  const contentType =
    file.type ||
    (() => {
      if (file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")) {
        return "image/jpeg";
      } else if (file.name.endsWith(".png")) {
        return "image/png";
      } else if (file.name.endsWith(".gif")) {
        return "image/gif";
      } else {
        return "application/octet-stream";
      }
    })();

  console.log("Using content type:", contentType);
  console.log("Upload starting...");
  console.log("SignedStorageURL prefix:", signedStorageURL.split("?")[0]);

=======
  // For mobile, sometimes we need to explicitly set the Content-Type
  const contentType = file.type || 
                     (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) ? 'image/jpeg' :
                     file.name.endsWith('.png') ? 'image/png' :
                     file.name.endsWith('.gif') ? 'image/gif' :
                     'application/octet-stream';
  
  console.log('Using content type:', contentType);
  console.log('Upload starting...');
  console.log('SignedStorageURL prefix:', signedStorageURL.split('?')[0]);
  
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  try {
    const response = await fetch(signedStorageURL, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": contentType,
      },
    });

    console.log('Upload response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      console.error("Error uploading file:", response.status, response.statusText);
      throw new Error(`Upload failed with status ${response.status}`);
    }

    // Verify the URL is accessible
    console.log('Upload complete, URL should be:', embeddedLink);
    
    return embeddedLink;
  } catch (error) {
    console.error("Fetch error during upload:", error);
    throw error;
  }
}

export function getDuration(startTime: string, endTime: string) {
  if (DateTime.fromISO(startTime) > DateTime.fromISO(endTime)) {
    return "";
  }
  // Format time as "1h 30m"
  const obj = Interval.fromDateTimes(
    DateTime.fromISO(startTime),
    DateTime.fromISO(endTime)
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
    /https?:\/\/(?!(?:.*\.(?:jpe?g|gif|png)))[^\s]+/g
  ) as string[];
  if (matches) {
    return matches;
  }
  return [];
};

export const getChannelLabel = (selectedChannels: Array<string>) => {
  if (selectedChannels.length === 0) {
    return "All Forums";
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
              readField("text", ref) === readField("text", newTagRef)
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

function isAlphaNumeric(str: string) {
  // The author of this validator is Michael Martin-Smucker. Source:
  // https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
  let code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
}

function checkUrl(str: string) {
  // Valid URL checker from Devshed
  // Sources:
  // https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
  // http://forums.devshed.com/javascript-development-115/regexp-to-match-url-pattern-493764.html
  const pattern = new RegExp(
    "^(https?:\\/\\/)" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  const valid = !!pattern.test(str);
  return valid;
}

const ALLOWED_ICONS = {
  COPY_LINK: 'COPY_LINK',
  REPORT: 'REPORT',
  GIVE_FEEDBACK: 'GIVE_FEEDBACK',
  VIEW_FEEDBACK: 'VIEW_FEEDBACK',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  CANCEL: 'CANCEL',
  UNDO: 'UNDO',
  ARCHIVE: 'ARCHIVE',
  UNARCHIVE: 'UNARCHIVE',
  SUSPEND: 'SUSPEND',
  UNSUSPEND: 'UNSUSPEND',
  ADD_ALBUM: 'ADD_ALBUM',
}

const actionIconMap = {
  [ALLOWED_ICONS.COPY_LINK]: LinkIcon,
  [ALLOWED_ICONS.REPORT]: FlagIcon,
  [ALLOWED_ICONS.GIVE_FEEDBACK]: HandThumbDownIcon,
  [ALLOWED_ICONS.VIEW_FEEDBACK]: EyeIcon,
  [ALLOWED_ICONS.EDIT]: PencilIcon,
  [ALLOWED_ICONS.DELETE]: TrashIcon,
  [ALLOWED_ICONS.CANCEL]: XmarkIcon,
  [ALLOWED_ICONS.UNDO]: XmarkIcon,
  [ALLOWED_ICONS.ARCHIVE]: ArchiveBox,
  [ALLOWED_ICONS.UNARCHIVE]: UnarchiveBox,
  [ALLOWED_ICONS.SUSPEND]: UserMinus,
  [ALLOWED_ICONS.UNSUSPEND]: UserPlus,
  [ALLOWED_ICONS.ADD_ALBUM]: ImageIcon,
}

export {
  ALLOWED_ICONS,
  actionIconMap,
  checkUrl,
  convertTimeToReadableFormat,
  getReadableTimeFromISO,
  isAlphaNumeric,
  timeAgo,
  formatDuration,
  formatAbbreviatedDuration,
  relativeTime,
  relativeTimeHoursAndMinutes,
  durationHoursAndMinutes,
  getDurationObj,
  compareDate,
  getDatePieces,
  getTimePieces,
};
