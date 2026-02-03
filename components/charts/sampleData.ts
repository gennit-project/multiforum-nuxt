// Sample data for the GitHub Contribution Chart
// This represents 52 weeks × 7 days with activity data
// For brevity, only showing 3 weeks with sample data

const currentYear = new Date().getFullYear();

// Generate 3 sample weeks of data
const generateSampleData = () => {
  // Create a starting date (first Sunday of the year or last of previous year)
  const firstDay = new Date(currentYear, 0, 1);
  const startDate = new Date(currentYear, 0, 1);
  startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Adjust to previous Sunday

  const sampleData = [];

  // Generate 3 sample weeks
  for (let week = 0; week < 3; week++) {
    const weekData = [];

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);

      // Generate random count of activities (more for weekdays, less for weekends)
      const isWeekend = day === 0 || day === 6;
      const maxActivities = isWeekend ? 2 : 4;
      const count = Math.floor(Math.random() * (maxActivities + 1));

      // Create activities
      const activities = [];
      for (let i = 0; i < count; i++) {
        const hour = 9 + Math.floor(Math.random() * 10); // Between 9 AM and 7 PM
        const minute = Math.floor(Math.random() * 60);

        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, minute);

        activities.push({
          id: `activity-${week}-${day}-${i}`,
          type: getActivityType(i),
          description: getRepositoryName(week + day + i),
          timestamp: timestamp.toISOString(),
        });
      }

      weekData.push({
        date: currentDate.toISOString().split('T')[0],
        count,
        activities,
      });
    }

    sampleData.push(weekData);
  }

  return sampleData;
};

// Sample activity types
const getActivityType = (index) => {
  const activities = [
    'Pushed to',
    'Opened a pull request in',
    'Merged a pull request in',
    'Created an issue in',
    'Reviewed a pull request in',
    'Commented on issue in',
    'Updated documentation in',
  ];
  return activities[index % activities.length];
};

// Sample repository names
const getRepositoryName = (index) => {
  const repos = [
    'project/frontend',
    'organization/api',
    'personal/website',
    'team/dashboard',
    'opensource/library',
    'company/app',
  ];
  return repos[index % repos.length];
};

// Generate the sample data
const sampleData = generateSampleData();

// How to use this data in a Vue component:
/*
<template>
  <ContributionChart :data="contributionData" />
</template>

<script setup>
import { ref } from 'vue';
import ContributionChart from './components/ContributionChart.vue';

// In a real app, you would fetch this data from an API
const contributionData = ref(sampleData);
</script>
*/

// To see a complete year's worth of data, use this function instead:
const generateFullYearData = () => {
  const firstDay = new Date(currentYear, 0, 1);
  const startDate = new Date(currentYear, 0, 1);
  startDate.setDate(firstDay.getDate() - firstDay.getDay()); // Adjust to previous Sunday

  const fullYearData = [];

  for (let week = 0; week < 52; week++) {
    const weekData = [];

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);

      // Generate count with higher activity in certain months (e.g., more in Q4)
      const month = currentDate.getMonth();
      const quarterIntensity =
        month >= 9 ? 0.8 : month >= 6 ? 0.6 : month >= 3 ? 0.4 : 0.3;
      const isWeekday = day >= 1 && day <= 5;
      const dayIntensity = isWeekday ? 0.7 : 0.3;

      // Combine factors for final probability
      const activityProbability = quarterIntensity * dayIntensity;

      // Generate count based on probability
      const maxCount = 5;
      const count =
        Math.random() < activityProbability
          ? Math.ceil(Math.random() * maxCount * activityProbability)
          : 0;

      // Create activities
      const activities = [];
      for (let i = 0; i < count; i++) {
        const hour = 9 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() * 60);

        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, minute);

        activities.push({
          id: `activity-${week}-${day}-${i}`,
          type: getActivityType((week + day + i) % 7),
          description: getRepositoryName((week + day + i) % 6),
          timestamp: timestamp.toISOString(),
        });
      }

      weekData.push({
        date: currentDate.toISOString().split('T')[0],
        count,
        activities,
      });
    }

    fullYearData.push(weekData);
  }

  return fullYearData;
};

// Uncomment to generate full year data
// const fullYearData = generateFullYearData();

export { sampleData, generateFullYearData };
