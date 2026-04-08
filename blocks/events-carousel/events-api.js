import {
  getBasePathBasedOnEnv,
  getSite,
  getLanguage,
  getDocumentLocale,
} from "../../scripts/utils.js";

export async function fetchVenueEvents(
  venue,
  category = "",
  site = "",
  lang = ""
) {
  let API_URL =
    getBasePathBasedOnEnv() +
    `/graphql/execute.json/CHG/GetEventListByVenue;venue=${venue}`;

  const formattedCategory = category
    ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
    : "";

  const formattedSite = site || getSite();
  const finalSite = formattedSite
    ? `/content/dam/patina/${formattedSite.toLowerCase()}`
    : "";

  const formattedLang = lang || getLanguage();

  if (formattedCategory) {
    API_URL += `;category=${formattedCategory}`;
  }
  if (finalSite) {
    API_URL += `;site=${finalSite}`;
  }
  if (formattedLang) {
    API_URL += `;lang=${formattedLang}`;
  }

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    return expandEvents(data.data?.eventList?.items || []);
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

// Helper functions from programs-listings-utils.js
function getWeeklyDates(start, end, days) {
  const result = [];
  const dayIndexes = days.map((day) => {
    const map = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return map[day] ?? new Date(day + " 2020").getDay();
  });

  let current = new Date(start);
  const endDate = new Date(end);
  current.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    if (dayIndexes.includes(current.getDay())) {
      result.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

function expandEvents(events) {
  const expanded = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const locale = getDocumentLocale();

  events.forEach((event) => {
    const images = Array.isArray(event.images) ? event.images : [];
    const numImages = images.length;

    const getNextImageIdx = (idx) => (numImages === 0 ? null : idx % numImages);

    const addOccurrence = (evt, date, timing, idx) => {
      if (!date || date < today) return;
      expanded.push({
        ...evt,
        displayDate: new Date(date),
        displayTiming: timing,
        sortTime: extractTimeValue(timing),
        imageIdx: getNextImageIdx(idx),
      });
    };

    const freq = (event.frequency || "").toLowerCase();

    switch (freq) {
      case "once": {
        if (event.onceDate) {
          const eventDate = new Date(event.onceDate);
          addOccurrence(event, eventDate, event.onceTiming, 0);
        }
        break;
      }
      case "daily": {
        if (event.dailyStartDate && event.dailyEndDate) {
          const start = new Date(event.dailyStartDate);
          const end = new Date(event.dailyEndDate);
          let current = new Date(start);
          let i = 0;
          while (current <= end) {
            addOccurrence(event, current, event.dailyTiming, i);
            if (current >= today) i++;
            current.setDate(current.getDate() + 1);
          }
        }
        break;
      }
      case "weekly": {
        if (
          event.weeklyStartDate &&
          event.weeklyEndDate &&
          event.weeklyDays?.length
        ) {
          const dates = getWeeklyDates(
            event.weeklyStartDate,
            event.weeklyEndDate,
            event.weeklyDays
          );
          dates.forEach((dateObj, i) =>
            addOccurrence(event, dateObj, event.weeklyTiming, i)
          );
        }
        break;
      }
      case "monthly": {
        if (event.monthlyStartDate && event.monthlyEndDate) {
          const start = new Date(event.monthlyStartDate);
          const end = new Date(event.monthlyEndDate);
          let current = new Date(start.getFullYear(), start.getMonth(), 1);
          let i = 0;

          if (Array.isArray(event.monthlyDays) && event.monthlyDays.length) {
            const days = event.monthlyDays.map((d) => Number.parseInt(d, 10));
            while (current <= end) {
              days.forEach((day) => {
                const eventDate = new Date(
                  current.getFullYear(),
                  current.getMonth(),
                  day
                );
                const inSameMonth = eventDate.getMonth() === current.getMonth();
                const inRange = eventDate >= start && eventDate <= end;
                if (inSameMonth && inRange && eventDate >= today) {
                  addOccurrence(event, eventDate, event.monthlyTiming, i);
                  i++;
                }
              });
              current.setMonth(current.getMonth() + 1);
            }
          } else {
            const weekday = start.getDay();
            while (current <= end) {
              let d = new Date(current.getFullYear(), current.getMonth(), 1);
              while (d.getMonth() === current.getMonth()) {
                const isTarget =
                  d.getDay() === weekday &&
                  d >= start &&
                  d <= end &&
                  d >= today;
                if (isTarget) {
                  addOccurrence(event, d, event.monthlyTiming, i);
                  i++;
                }
                d.setDate(d.getDate() + 1);
              }
              current.setMonth(current.getMonth() + 1);
            }
          }
        }
        break;
      }
      default:
        break;
    }
  });

  function extractTimeValue(timing) {
    if (!timing) return 0;
    const timeStr = timing.split("–")[0].trim();
    const timeMatch = timeStr.match(/(\d+)(?::\d+)?\s*(am|pm)?/i);
    if (!timeMatch) return 0;

    let hours = parseInt(timeMatch[1]);
    const period = timeMatch[2]?.toLowerCase();

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    return hours;
  }

  const seen = new Set();
  const deduplicated = expanded.filter((event) => {
    const key =
      (event.id || event.title || JSON.stringify(event)) +
      "|" +
      event.displayDate.toISOString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduplicated
    .sort((a, b) => {
      const dateDiff = a.displayDate - b.displayDate;
      if (dateDiff !== 0) return dateDiff;
      return (a.sortTime || 0) - (b.sortTime || 0);
    })
    .slice(0, 7)
    .map((event) => ({
      ...event,

      dayOfWeek: event.displayDate.toLocaleDateString(locale, {
        weekday: "short",
      }),
      shortDate: event.displayDate.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      }),
      fullDate: event.displayDate.toLocaleDateString(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));
}
