<script setup lang="ts">
  import { ref } from "vue";
  import { DateTime } from "luxon";
  import type { Event as EventData } from "@/__generated__/graphql";
  import PrimaryButton from "../PrimaryButton.vue";

  const props = defineProps({
    event: {
      type: Object as () => EventData,
      required: true,
    },
  });

  const addToGoogleCalendar = () => {
    const googleCalendarDateFormat = "yyyyMMdd'T'HHmmss";
    const start = DateTime.fromISO(props.event?.startTime).toFormat(googleCalendarDateFormat);
    const end = DateTime.fromISO(props.event?.endTime).toFormat(googleCalendarDateFormat);

    const baseUrl = "https://www.google.com/calendar/render";
    const location = props.event?.address
      ? encodeURIComponent(props.event?.address)
      : encodeURIComponent(props.event?.virtualEventUrl || "");
    const name = encodeURIComponent(props.event?.title);
    const details = encodeURIComponent(props.event?.description || "");

    const googleUrl = `${baseUrl}?action=TEMPLATE&text=${name}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(googleUrl, "_blank");
  };

  const addToiCal = () => {
    const data = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `URL:${document.URL}`,
      `DTSTART:${props.event?.startTime.replace(/-|:|\.\d{3}/g, "")}`,
      `DTEND:${props.event?.endTime.replace(/-|:|\.\d{3}/g, "")}`,
      `SUMMARY:${props.event?.title}`,
      `DESCRIPTION:${props.event?.description}`,
      `LOCATION:${props.event?.address}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([data], { type: "text/calendar;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "event.ics");
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
      label: "Google Calendar",
      event: "google",
    },
    {
      label: "iCal",
      event: "ical",
    },
    {
      label: "Outlook",
      event: "outlook",
    },
  ]);
</script>
<template>
  <MenuButton
    data-testid="add-to-calendar-button"
    :items="calendarOptions"
    @google="addToGoogleCalendar"
    @ical="addToiCal"
    @outlook="addToOutlook"
  >
    <PrimaryButton :label="'+ Add to Calendar'" />
  </MenuButton>
</template>
