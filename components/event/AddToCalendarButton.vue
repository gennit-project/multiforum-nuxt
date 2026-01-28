<script setup lang="ts">
import { ref } from 'vue';
import { DateTime } from 'luxon';
import type { Event as EventData } from '@/__generated__/graphql';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';

const props = defineProps({
  event: {
    type: Object as () => EventData,
    required: true,
  },
});

const addToGoogleCalendar = () => {
  const googleCalendarDateFormat = "yyyyMMdd'T'HHmmss";
  const start = DateTime.fromISO(props.event?.startTime).toFormat(
    googleCalendarDateFormat
  );
  const end = DateTime.fromISO(props.event?.endTime).toFormat(
    googleCalendarDateFormat
  );

  const baseUrl = 'https://www.google.com/calendar/render';
  const location = props.event?.address
    ? encodeURIComponent(props.event?.address)
    : encodeURIComponent(props.event?.virtualEventUrl || '');
  const name = encodeURIComponent(props.event?.title);
  const details = encodeURIComponent(props.event?.description || '');

  const googleUrl = `${baseUrl}?action=TEMPLATE&text=${name}&dates=${start}/${end}&details=${details}&location=${location}`;
  window.open(googleUrl, '_blank');
};

const addToiCal = () => {
  const data = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `URL:${document.URL}`,
    `DTSTART:${props.event?.startTime.replace(/-|:|\.\d{3}/g, '')}`,
    `DTEND:${props.event?.endTime.replace(/-|:|\.\d{3}/g, '')}`,
    `SUMMARY:${props.event?.title}`,
    `DESCRIPTION:${props.event?.description}`,
    `LOCATION:${props.event?.address}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');

  const blob = new Blob([data], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'event.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
const addToOutlook = () => {
  // For Outlook, you can use the same iCal method, because Outlook supports iCal files.
  // Alternatively, if you want to create a link to Outlook Calendar's web version, you would construct a URL like the Google Calendar one.
  addToiCal();
};

const calendarOptions = ref([
  {
    label: 'Google Calendar',
    event: 'google',
  },
  {
    label: 'iCal',
    event: 'ical',
  },
  {
    label: 'Outlook',
    event: 'outlook',
  },
]);

const addToCalendarButtonClasses =
  'bg-orange-400 hover:bg-orange-400 dark:border dark:border-orange-500 dark:bg-orange-400 dark:text-black dark:hover:bg-orange-400 focus:ring-orange-500 px-4 py-2 justify-center items-center whitespace-nowrap font-medium';
</script>
<template>
  <MenuButton
    data-testid="add-to-calendar-button"
    :button-class="addToCalendarButtonClasses"
    :items="calendarOptions"
    @google="addToGoogleCalendar"
    @ical="addToiCal"
    @outlook="addToOutlook"
  >
    <span class="inline-flex items-center gap-2">
      + Add to Calendar
      <ChevronDownIcon class="h-4 w-4" aria-hidden="true" />
    </span>
  </MenuButton>
</template>
