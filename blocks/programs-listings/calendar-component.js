import {
  getDocumentLocale,
  getLocalizedDayNames,
} from "../../scripts/utils.js";

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatMonthYear(date) {
  const locale = getDocumentLocale();
  return date.toLocaleString(locale, { month: "long", year: "numeric" });
}

function isSameDay(d1, d2) {
  return (
    d1 &&
    d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isInRange(date, start, end) {
  if (!start || !end) return false;
  const t = date.setHours(0, 0, 0, 0);
  return t >= start.setHours(0, 0, 0, 0) && t <= end.setHours(0, 0, 0, 0);
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateForDisplay(date) {
  if (!date) return "";

  const locale = getDocumentLocale();
  const options = { day: "2-digit", month: "short", year: "numeric" };
  const formatted = date.toLocaleDateString(locale, options);
  const parts = formatted.split(" ");

  if (parts.length === 3) {
    const month = parts[0];
    const day = parts[1].replace(",", "");
    const year = parts[2];
    return `${day} ${month}, ${year}`;
  }

  return formatted;
}

/**
 * Helper function to format date ranges according to the new requirements
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {string}
 */
function formatDateRangeForDisplay(startDate, endDate) {
  if (!startDate || !endDate) return "";

  const currentYear = new Date().getFullYear();
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const formatSingleDate = (date, includeYear = false) => {
    const locale = getDocumentLocale();
    const options = includeYear
      ? { day: "2-digit", month: "short", year: "numeric" }
      : { day: "2-digit", month: "short" };

    const formatted = date.toLocaleDateString(locale, options);
    const parts = formatted.split(" ");

    if (includeYear && parts.length === 3) {
      const month = parts[0];
      const day = parts[1].replace(",", "");
      const year = parts[2];
      return `${day} ${month}, ${year}`;
    } else if (!includeYear && parts.length === 2) {
      const month = parts[0];
      const day = parts[1].replace(",", "");
      return `${day} ${month}`;
    }

    return formatted;
  };

  if (startDate.getTime() === endDate.getTime()) {
    return formatSingleDate(startDate, true);
  }

  if (startYear === currentYear && endYear === currentYear) {
    const startFormatted = formatSingleDate(startDate, false);
    const endFormatted = formatSingleDate(endDate, true);
    return `${startFormatted} - ${endFormatted}`;
  } else if (startYear === currentYear && endYear !== currentYear) {
    const startFormatted = formatSingleDate(startDate, false);
    const endFormatted = formatSingleDate(endDate, true);
    return `${startFormatted} - ${endFormatted}`;
  } else if (startYear !== currentYear && endYear !== currentYear) {
    const startFormatted = formatSingleDate(startDate, true);
    const endFormatted = formatSingleDate(endDate, true);
    return `${startFormatted} - ${endFormatted}`;
  } else {
    const startFormatted = formatSingleDate(startDate, true);
    const endFormatted = formatSingleDate(endDate, true);
    return `${startFormatted} - ${endFormatted}`;
  }
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateForData(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createCalendar({
  selectedDate = null,
  selectedRange = null,
  onSelect = () => {},
  onDone = () => {},
  minDate = null,
  maxDate = null,
  hideDoneButton = false,
  placeholders = null,
} = {}) {
  let currentMonth = selectedDate ? new Date(selectedDate) : new Date();
  currentMonth.setDate(1);
  let rangeStart = selectedRange ? new Date(selectedRange[0]) : null;
  let rangeEnd = selectedRange ? new Date(selectedRange[1]) : null;
  let tempStart = rangeStart;
  let tempEnd = rangeEnd;

  const calendar = document.createElement("div");
  calendar.className = "events-filter-dropdown calendar-dropdown";
  calendar.setAttribute("aria-open", "false");

  function render() {
    calendar.innerHTML = "";
    // Header
    const header = document.createElement("div");
    header.className = "filter-dropdown-header";
    const left = document.createElement("button");
    left.type = "button";
    const leftArrowImg = document.createElement("img");
    leftArrowImg.src = `${window.hlx.codeBasePath}/icons/arrow.svg`;
    leftArrowImg.alt = "Previous month";
    leftArrowImg.width = 24;
    leftArrowImg.height = 24;
    leftArrowImg.style.filter = "invert(1)";

    // Check if previous month contains current/future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const prevMonthLastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0
    );
    const prevMonthHasFutureDates = prevMonthLastDay >= today;

    if (prevMonthHasFutureDates) {
      left.onmouseenter = () => {
        if (!left.disabled) {
          leftArrowImg.style.filter = "invert(1) brightness(2)";
        }
      };
      left.onmouseleave = () => {
        if (!left.disabled) {
          leftArrowImg.style.filter = "invert(1)";
        }
      };
    }

    left.appendChild(leftArrowImg);
    left.className = "calendar-nav calendar-nav-left";

    // Disable left arrow if at current month (today)
    const isCurrentMonth =
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth();
    if (isCurrentMonth) {
      left.disabled = true;
      left.classList.add("calendar-nav-disabled");
    } else {
      left.onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        render();
      };
    }

    const right = document.createElement("button");
    right.type = "button";
    const rightArrowImg = document.createElement("img");
    rightArrowImg.src = `${window.hlx.codeBasePath}/icons/arrow.svg`;
    rightArrowImg.alt = "Next month";
    rightArrowImg.width = 24;
    rightArrowImg.height = 24;
    rightArrowImg.style.filter = "invert(1)";
    rightArrowImg.style.transform = "rotate(180deg)";

    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    const nextMonthHasFutureDates = !maxDate || nextMonth <= maxDate;

    if (nextMonthHasFutureDates) {
      rightArrowImg.style.filter = "invert(1) brightness(2)";
      right.onmouseenter = () => {
        rightArrowImg.style.filter = "invert(1) brightness(2.5)";
      };
      right.onmouseleave = () => {
        rightArrowImg.style.filter = "invert(1) brightness(2)";
      };
    } else {
      rightArrowImg.style.filter = "invert(1)";
    }

    right.appendChild(rightArrowImg);
    right.className = "calendar-nav calendar-nav-right";
    right.onclick = () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    };

    const label = document.createElement("span");
    label.className = "calendar-month-label text-l2";
    label.textContent = formatMonthYear(currentMonth);
    header.append(left, label, right);
    calendar.appendChild(header);

    // Days of week (start from Monday)
    const daysRow = document.createElement("div");
    daysRow.className = "calendar-days-row";
    const days = getLocalizedDayNames();
    days.forEach((d) => {
      const el = document.createElement("p");
      el.className = "calendar-day-label";
      el.textContent = d;
      daysRow.appendChild(el);
    });
    calendar.appendChild(daysRow);

    // Dates grid (start from Monday, fill previous month's trailing days)
    const grid = document.createElement("div");
    grid.className = "calendar-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7, 1fr)";
    const firstDay = new Date(currentMonth);
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 7; // treat Sunday as 7
    // Calculate previous month's trailing days
    const prevMonthObj = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0
    );
    const prevMonthDays = prevMonthObj.getDate();
    // Fill previous month's trailing days (now as buttons)
    for (let i = startDay - 1; i > 0; i--) {
      const prevDate = prevMonthDays - i + 1;
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        prevDate
      );
      date.setHours(0, 0, 0, 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-date-blank calendar-date-prev";
      btn.textContent = prevDate;
      // Disable if before today
      if (date < today) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      if ((minDate && date < minDate) || (maxDate && date > maxDate)) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      // Highlight selected, in range, or today
      const isSelected = isSameDay(date, tempStart) && isSameDay(date, tempEnd);
      if (isSelected) {
        btn.classList.add("calendar-date-selected");
      } else if (tempStart && tempEnd && isInRange(date, tempStart, tempEnd)) {
        btn.classList.add("calendar-date-inrange");
      }
      // Add class for today (current date)
      if (isSameDay(date, today)) {
        btn.classList.add("calendar-date-today");
        if (!tempStart && !tempEnd) {
          btn.classList.add("calendar-date-today");
        }
      }
      btn.onclick = () => {
        if (btn.disabled) return;
        // Use same selection logic as main dates
        if (!tempStart && !tempEnd) {
          tempStart = date;
          tempEnd = date;
        } else if (tempStart && tempEnd && isSameDay(tempStart, tempEnd)) {
          if (isSameDay(date, tempStart)) {
            tempStart = null;
            tempEnd = null;
          } else {
            if (date < tempStart) {
              tempEnd = tempStart;
              tempStart = date;
            } else {
              tempEnd = date;
            }
          }
        } else if (tempStart && tempEnd && !isSameDay(tempStart, tempEnd)) {
          tempStart = date;
          tempEnd = date;
        }
        render();

        if (hideDoneButton) {
          if (!tempStart && !tempEnd) {
            onSelect({ display: "", value: "" });
          } else if (tempStart && tempEnd) {
            const displayText = formatDateRangeForDisplay(tempStart, tempEnd);
            const startData = formatDateForData(tempStart);
            if (isSameDay(tempStart, tempEnd)) {
              onSelect({ display: displayText, value: startData });
            } else {
              const endData = formatDateForData(tempEnd);
              onSelect({
                display: displayText,
                value: `${startData} - ${endData}`,
              });
            }
          } else if (tempStart) {
            const displayText = formatDateRangeForDisplay(tempStart, tempStart);
            const startData = formatDateForData(tempStart);
            onSelect({ display: displayText, value: startData });
          }
        }
      };
      grid.appendChild(btn);
    }
    // Dates of current month
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        d
      );
      date.setHours(0, 0, 0, 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-date-btn";
      btn.textContent = d;
      // Disable if before today
      if (date < today) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      // Disabled if out of min/max
      if ((minDate && date < minDate) || (maxDate && date > maxDate)) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      // Highlight selected, in range, or today
      const isSelected = isSameDay(date, tempStart) && isSameDay(date, tempEnd);
      if (isSelected) {
        btn.classList.add("calendar-date-selected");
      } else if (tempStart && tempEnd && isInRange(date, tempStart, tempEnd)) {
        btn.classList.add("calendar-date-inrange");
      }
      // Add class for today (current date)
      if (isSameDay(date, today)) {
        btn.classList.add("calendar-date-today");
        if (!tempStart && !tempEnd) {
          btn.classList.add("calendar-date-today");
        }
      }
      btn.onclick = () => {
        if (btn.disabled) return;
        // If nothing selected, start new selection
        if (!tempStart && !tempEnd) {
          tempStart = date;
          tempEnd = date;
        } else if (tempStart && tempEnd && isSameDay(tempStart, tempEnd)) {
          // Single date selected
          if (isSameDay(date, tempStart)) {
            // Deselect if clicking same date
            tempStart = null;
            tempEnd = null;
          } else {
            // Set range (order agnostic)
            if (date < tempStart) {
              tempEnd = tempStart;
              tempStart = date;
            } else {
              tempEnd = date;
            }
          }
        } else if (tempStart && tempEnd && !isSameDay(tempStart, tempEnd)) {
          // Range already selected, start new selection
          tempStart = date;
          tempEnd = date;
        }
        render();
        if (hideDoneButton) {
          if (!tempStart && !tempEnd) {
            onSelect({ display: "", value: "" });
          } else if (tempStart && tempEnd) {
            const displayText = formatDateRangeForDisplay(tempStart, tempEnd);
            const startData = formatDateForData(tempStart);
            if (isSameDay(tempStart, tempEnd)) {
              onSelect({ display: displayText, value: startData });
            } else {
              const endData = formatDateForData(tempEnd);
              onSelect({
                display: displayText,
                value: `${startData} - ${endData}`,
              });
            }
          } else if (tempStart) {
            const displayText = formatDateRangeForDisplay(tempStart, tempStart);
            const startData = formatDateForData(tempStart);
            onSelect({ display: displayText, value: startData });
          }
        }
      };
      grid.appendChild(btn);
    }
    // Calculate next month's leading days
    const totalCells = startDay - 1 + daysInMonth;
    const nextDays = (7 - (totalCells % 7)) % 7;
    // Fill next month's leading days to complete the last week (now as buttons)
    for (let i = 1; i <= nextDays; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        i
      );
      date.setHours(0, 0, 0, 0);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-date-blank calendar-date-next";
      btn.textContent = i;
      // Disable if before today
      if (date < today) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      if ((minDate && date < minDate) || (maxDate && date > maxDate)) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }
      // Highlight selected, in range, or today
      const isSelected = isSameDay(date, tempStart) && isSameDay(date, tempEnd);
      if (isSelected) {
        btn.classList.add("calendar-date-selected");
      } else if (tempStart && tempEnd && isInRange(date, tempStart, tempEnd)) {
        btn.classList.add("calendar-date-inrange");
      }
      // Add class for today (current date)
      if (isSameDay(date, today)) {
        btn.classList.add("calendar-date-today");
        if (!tempStart && !tempEnd) {
          btn.classList.add("calendar-date-today");
        }
      }
      btn.onclick = () => {
        if (btn.disabled) return;
        // Use same selection logic as main dates
        if (!tempStart && !tempEnd) {
          tempStart = date;
          tempEnd = date;
        } else if (tempStart && tempEnd && isSameDay(tempStart, tempEnd)) {
          if (isSameDay(date, tempStart)) {
            tempStart = null;
            tempEnd = null;
          } else {
            if (date < tempStart) {
              tempEnd = tempStart;
              tempStart = date;
            } else {
              tempEnd = date;
            }
          }
        } else if (tempStart && tempEnd && !isSameDay(tempStart, tempEnd)) {
          tempStart = date;
          tempEnd = date;
        }
        render();

        if (hideDoneButton) {
          if (!tempStart && !tempEnd) {
            onSelect({ display: "", value: "" });
          } else if (tempStart && tempEnd) {
            const displayText = formatDateRangeForDisplay(tempStart, tempEnd);
            const startData = formatDateForData(tempStart);
            if (isSameDay(tempStart, tempEnd)) {
              onSelect({ display: displayText, value: startData });
            } else {
              const endData = formatDateForData(tempEnd);
              onSelect({
                display: displayText,
                value: `${startData} - ${endData}`,
              });
            }
          } else if (tempStart) {
            const displayText = formatDateRangeForDisplay(tempStart, tempStart);
            const startData = formatDateForData(tempStart);
            onSelect({ display: displayText, value: startData });
          }
        }
      };
      grid.appendChild(btn);
    }
    calendar.appendChild(grid);

    // Done button (restore)
    if (!hideDoneButton) {
      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "events-filter-done-btn cta-button";
      doneBtn.textContent = placeholders?.doneButton || "Done";
      doneBtn.onclick = () => {
        // If nothing selected, clear filter
        if (!tempStart && !tempEnd) {
          onSelect({ display: "", value: "" });
        } else if (tempStart && tempEnd) {
          const displayText = formatDateRangeForDisplay(tempStart, tempEnd);
          const startData = formatDateForData(tempStart);
          if (isSameDay(tempStart, tempEnd)) {
            onSelect({ display: displayText, value: startData });
          } else {
            const endData = formatDateForData(tempEnd);
            onSelect({
              display: displayText,
              value: `${startData} - ${endData}`,
            });
          }
        } else if (tempStart) {
          const displayText = formatDateRangeForDisplay(tempStart, tempStart);
          const startData = formatDateForData(tempStart);
          onSelect({ display: displayText, value: startData });
        }
        onDone();
      };
      calendar.appendChild(doneBtn);
    }
  }

  render();

  return calendar;
}
