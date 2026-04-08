import {
  getBasePathBasedOnEnv,
  getSite,
  getLanguage,
  getDocumentLocale,
  kebabToNormal,
} from "../../scripts/utils.js";

const site = getSite();
const lang = getLanguage();

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const locale = getDocumentLocale();
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getDayOfWeek(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const locale = getDocumentLocale();
  return d.toLocaleDateString(locale, { weekday: "short" });
}

export function getWeeklyDates(start, end, days) {
  const result = [];
  const dayIndexes = days.map((day) => {
    // Accepts both full and short names
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

export function getMonthlyDates(start, end, days) {
  const result = [];
  let current = new Date(start);
  const endDate = new Date(end);
  current.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    const day = current.getDate();
    if (days.includes(day) || days.includes(day.toString())) {
      result.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

// Helper to get destination from _path
export function getDestinationFromPath(path) {
  if (!path) return "";
  if (path.includes("osaka")) return "osaka";
  if (path.includes("maldives")) return "maldives";
  return "";
}

// Expands recurring programs into individual program instances (for filtering and display)
export function expandPrograms(programs) {
  const expanded = [];
  programs.forEach((program) => {
    let hasRecurrence = false;
    let imageIdx = 0;
    const images = Array.isArray(program.images) ? program.images : [];
    const numImages = images.length;

    function getNextImageIdx(idx) {
      if (numImages === 0) return null;
      return idx % numImages;
    }

    // Use frequency to determine which fields to expand
    const freq = (program.frequency || "").toLowerCase();
    if (freq === "once" && program.onceDate) {
      expanded.push({
        program,
        date: program.onceDate,
        timing: program.onceTiming,
        imageIdx: getNextImageIdx(0),
      });
      hasRecurrence = true;
    } else if (
      freq === "daily" &&
      program.dailyStartDate &&
      program.dailyEndDate
    ) {
      let current = new Date(program.dailyStartDate);
      const end = new Date(program.dailyEndDate);
      let i = 0;
      while (current <= end) {
        expanded.push({
          program,
          date: current.toISOString(),
          timing: program.dailyTiming,
          imageIdx: getNextImageIdx(i),
        });
        current.setDate(current.getDate() + 1);
        i++;
      }
      hasRecurrence = true;
    } else if (
      freq === "weekly" &&
      program.weeklyStartDate &&
      program.weeklyEndDate &&
      program.weeklyDays &&
      program.weeklyDays.length
    ) {
      const dates = getWeeklyDates(
        program.weeklyStartDate,
        program.weeklyEndDate,
        program.weeklyDays
      );
      dates.forEach((dateObj, i) => {
        expanded.push({
          program,
          date: dateObj.toISOString(),
          timing: program.weeklyTiming,
          imageIdx: getNextImageIdx(i),
        });
      });
      hasRecurrence = true;
    } else if (
      freq === "monthly" &&
      program.monthlyStartDate &&
      program.monthlyEndDate
    ) {
      let days = [];
      let useWeekday = false;

      if (Array.isArray(program.monthlyDays) && program.monthlyDays.length) {
        days = program.monthlyDays.map((d) => Number.parseInt(d, 10));
      } else {
        useWeekday = true;
      }

      const start = new Date(program.monthlyStartDate);
      const end = new Date(program.monthlyEndDate);
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      let i = 0;
      while (current <= end) {
        if (useWeekday) {
          const weekday = start.getDay();
          let d = new Date(current.getFullYear(), current.getMonth(), 1);
          while (d.getMonth() === current.getMonth()) {
            if (d.getDay() === weekday) {
              if (d >= start && d <= end) {
                expanded.push({
                  program,
                  date: d.toISOString(),
                  timing: program.monthlyTiming,
                  imageIdx: getNextImageIdx(i),
                });
                i++;
              }
            }
            d.setDate(d.getDate() + 1);
          }
        } else {
          days.forEach((day) => {
            const d = new Date(current.getFullYear(), current.getMonth(), day);
            if (
              d.getMonth() === current.getFullMonth() &&
              d >= start &&
              d <= end
            ) {
              expanded.push({
                program,
                date: d.toISOString(),
                timing: program.monthlyTiming,
                imageIdx: getNextImageIdx(i),
              });
              i++;
            }
          });
        }
        current.setMonth(current.getMonth() + 1);
      }
      hasRecurrence = true;
    }

    if (!hasRecurrence) {
      expanded.push({
        program,
        date: null,
        timing: null,
        imageIdx: getNextImageIdx(0),
      });
    }
  });

  // Deduplicate by program and date
  const seen = new Set();
  return expanded.filter(({ program, date }) => {
    const key =
      (program.id || program.title || JSON.stringify(program)) +
      "|" +
      (date || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Extracts categories and subcategories from programs
export function extractCategories(programs) {
  const categories = {};
  programs.forEach((program) => {
    if (!program.category || !program.subcategory) return;
    if (!categories[program.category]) categories[program.category] = new Set();

    let subs = program.subcategory;
    if (typeof subs === "string") {
      subs = subs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(subs)) subs = [subs];

    subs.forEach((sub) => categories[program.category].add(sub));
  });

  Object.keys(categories).forEach((cat) => {
    categories[cat] = Array.from(categories[cat]);
  });

  return categories;
}

// Flattens all subcategories from categories object
export function getAllSubcategories(categories) {
  return Object.values(categories).flat();
}

export function getDatePillText() {
  if (!dateFilterState.selected.length) {
    // Default: today
    const today = new Date();
    const locale = getDocumentLocale();
    return today.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (dateFilterState.selected.length === 1) {
    const d = dateFilterState.selected[0];
    const locale = getDocumentLocale();
    return d.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (dateFilterState.selected.length === 2) {
    const d1 = dateFilterState.selected[0];
    const d2 = dateFilterState.selected[1];

    // If same day, show only one date
    if (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    ) {
      const locale = getDocumentLocale();
      return d1.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    const locale = getDocumentLocale();
    return `${d1.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })} - ${d2.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  return "";
}

const EVENTS_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetEvents;site=/content/dam/patina/${site};lang=${lang};`;
const ARTISTS_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetArtists;site=/content/dam/patina/${site};lang=${lang};`;
const ACTIVITY_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetActivities;site=/content/dam/patina/${site};lang=${lang};`;

const programTypeConfig = {
  activity: {
    url: ACTIVITY_API_URL,
    dataKey: "activityList",
  },
  event: {
    url: EVENTS_API_URL,
    dataKey: "eventList",
  },
  artist: {
    url: ARTISTS_API_URL,
    dataKey: "artistList",
  },
};

export function handleEditorEnv(programs, block) {
  const programTabs = [];

  programs.forEach((program) => {
    const programType = program.children[0]?.textContent.trim();

    const config = programTypeConfig[programType] || null;
    // Fetch API
    if (!config) return;
    fetch(config.url)
      .then((res) => res.json())
      .then((data) => {
        const programs = data.data?.[config.dataKey]?.items || [];
        renderPrograms(programType, programs);
      })
      .catch((error) => {
        console.error("Error fetching programs", error);
      });

    // Program Pill
    const programTab = program.children[1]?.textContent.trim();
    programTabs.push(programTab);

    // Render Filter Pill
    const filterDiv = document.createElement("div");
    filterDiv.classList.add("program-filter-pill");
    filterDiv.textContent = `All ${
      programType.charAt(0).toUpperCase() + programType.slice(1)
    }`;
    program.appendChild(filterDiv);

    // Placeholder Cards Container
    const cardsContainer = document.createElement("div");
    cardsContainer.classList.add("program-cards-container");
    program.appendChild(cardsContainer);

    let cardNum = 12; // Default number of placeholder cards
    // Options
    const applyOptions = program.children[3]?.textContent?.trim() === "true";
    if (applyOptions) {
      const options = program.children[4].children;
      const columns = options[0]?.textContent?.trim() || "4";
      const maxPrograms = options[1]?.textContent?.trim() || 0;
      const hideFilters = options[2]?.textContent?.trim() === "true";

      // Determine number of placeholder cards
      cardNum =
        maxPrograms && +maxPrograms === 0 ? 12 : Math.min(+maxPrograms, 12);

      // Set grid columns based on options
      cardsContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

      // Hide filter pill if specified
      filterDiv.style.display = hideFilters ? "none" : "block";
    }

    function renderPrograms(programType, programs) {
      if (programType === "artist" || programType === "activity") {
        if (programType === "activity") {
          // Sort: bring programs with activityTag to the front
          programs.sort((a, b) => {
            if (a.activityTag && !b.activityTag) return -1;
            if (!a.activityTag && b.activityTag) return 1;
            return 0;
          });
        }
        programs.slice(0, cardNum).forEach((program) => {
          const card = document.createElement("div");
          card.classList.add("program-card");
          card.innerHTML = `
        <section class="program-card">
          <div class="program-image-wrapper">
    
          <img src="${program.images[0]?._publishUrl}" alt="${
            program.title || ""
          }" />
     
        ${
          program?.activityTag
            ? `<p class="activity-tag text-l3 bg-brand-sage text-text-white">${program?.activityTag}</p>`
            : ""
        }
          </div>
          <p class="program-category text-l2">${
            kebabToNormal(program?.category) || ""
          }</p>
          <h3 class="program-title text-h3">${program?.title || ""}</h3>
          ${
            program?.description
              ? `<p class="program-desc text-p2">${program?.description}</p>`
              : ""
          }
        </section>
      `;
          cardsContainer.appendChild(card);
        });
      } else {
        let expandedPrograms = expandPrograms(programs);
        // Filter out past dates
        const now = new Date();
        expandedPrograms = expandedPrograms.filter(({ date }) => {
          if (!date) return true;
          return (
            new Date(date).setHours(0, 0, 0, 0) >= now.setHours(0, 0, 0, 0)
          );
        });
        expandedPrograms.sort((a, b) => new Date(a.date) - new Date(b.date));
        expandedPrograms.slice(0, cardNum).forEach(({ program, date }) => {
          const card = document.createElement("div");
          card.classList.add("program-card");
          const eventDate = formatDate(date);
          const dayOfWeek = getDayOfWeek(date);
          card.innerHTML = `
                <section class="program-card">
                  <div class="program-image-wrapper">
                   <img src="${program.images[0]?._publishUrl}" alt="${
            program.title || ""
          }" />
                    <div class="program-date-wrapper">
                      <p class="program-day text-l3">${dayOfWeek}</p>
                        <p class="program-date text-l2">${eventDate.replace(
                          /,? ?\d{4}/,
                          ""
                        )}</p>
                    </div>
                  </div>
                  <p class="program-category text-l2">${
                    kebabToNormal(program.category) || ""
                  }</p>
                  <h3 class="program-title text-h3">${program.title || ""}</h3>
                  <div class="program-details">
          
                ${
                  !!program.venue
                    ? `<p class="program-venue venue-icon">${program.venue}</p>`
                    : ""
                }
                </div>
                </section>
              `;
          cardsContainer.appendChild(card);
        });
      }
    }
  });

  // Program Pill (if multiple types)
  if (programTabs.length > 1) {
    const programPill = document.createElement("div");
    programPill.classList.add("program-pill");
    programTabs.forEach((tab) => {
      const div = document.createElement("div");
      div.textContent = tab;
      programPill.appendChild(div);
    });
    block.prepend(programPill);
  }
}
