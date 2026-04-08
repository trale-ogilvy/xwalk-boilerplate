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
  const time = date.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();
  return time >= startTime && time <= endTime;
}

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDateForDisplay(date) {
  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

export function createCalendarBoard({
  selectedRange = null,
  onSelect = () => {},
  onDone = () => {},
} = {}) {
  const currentMonth =
    selectedRange && selectedRange[0] ? new Date(selectedRange[0]) : new Date();
  currentMonth.setDate(1);

  let tempStart =
    selectedRange && selectedRange[0] ? new Date(selectedRange[0]) : null;
  let tempEnd =
    selectedRange && selectedRange[1] ? new Date(selectedRange[1]) : null;

  const calendar = document.createElement("div");
  calendar.className = "general-modal-calendar-board";

  calendar.addEventListener("click", (e) => e.stopPropagation());

  function render() {
    calendar.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const header = document.createElement("div");
    header.className = "general-modal-calendar-header";

    const prevBtn = document.createElement("button");
    prevBtn.className =
      "general-modal-calendar-nav general-modal-calendar-nav-prev";
    prevBtn.type = "button";
    prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
  <g opacity="0.5">
    <mask id="mask0_36_33984" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
      <rect x="0.632812" width="24" height="24" fill="#D9D9D9"/>
    </mask>
    <g mask="url(#mask0_36_33984)">
      <path d="M8.48125 13.0005L11.3313 15.8505C11.5312 16.0505 11.6271 16.2838 11.6188 16.5505C11.6104 16.8172 11.5146 17.0505 11.3313 17.2505C11.1313 17.4505 10.8938 17.5547 10.6188 17.563C10.3438 17.5713 10.1062 17.4755 9.90625 17.2755L5.33125 12.7005C5.13125 12.5005 5.03125 12.2672 5.03125 12.0005C5.03125 11.7338 5.13125 11.5005 5.33125 11.3005L9.90625 6.7255C10.1062 6.5255 10.3438 6.42967 10.6188 6.438C10.8938 6.44633 11.1313 6.5505 11.3313 6.7505C11.5146 6.9505 11.6104 7.18383 11.6188 7.4505C11.6271 7.71717 11.5312 7.9505 11.3313 8.1505L8.48125 11.0005H19.6313C19.9146 11.0005 20.1521 11.0963 20.3438 11.288C20.5354 11.4797 20.6313 11.7172 20.6313 12.0005C20.6313 12.2838 20.5354 12.5213 20.3438 12.713C20.1521 12.9047 19.9146 13.0005 19.6313 13.0005H8.48125Z" fill="#D9D9D9"/>
    </g>
  </g>
</svg>`;

    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (currentMonthStart <= todayMonthStart) {
      prevBtn.disabled = true;
      prevBtn.classList.add("general-modal-calendar-nav-disabled");
    } else {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        render();
      });
    }

    const nextBtn = document.createElement("button");
    nextBtn.className =
      "general-modal-calendar-nav general-modal-calendar-nav-next";
    nextBtn.type = "button";
    nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
  <mask id="mask0_36_33986" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
    <rect x="24.6328" y="24" width="24" height="24" transform="rotate(-180 24.6328 24)" fill="#D9D9D9"/>
  </mask>
  <g mask="url(#mask0_36_33986)">
    <path d="M16.7844 10.9995L13.9344 8.1495C13.7344 7.9495 13.6385 7.71617 13.6469 7.4495C13.6552 7.18283 13.751 6.9495 13.9344 6.7495C14.1344 6.5495 14.3719 6.44533 14.6469 6.437C14.9219 6.42867 15.1594 6.5245 15.3594 6.7245L19.9344 11.2995C20.1344 11.4995 20.2344 11.7328 20.2344 11.9995C20.2344 12.2662 20.1344 12.4995 19.9344 12.6995L15.3594 17.2745C15.1594 17.4745 14.9219 17.5703 14.6469 17.562C14.3719 17.5537 14.1344 17.4495 13.9344 17.2495C13.751 17.0495 13.6552 16.8162 13.6469 16.5495C13.6385 16.2828 13.7344 16.0495 13.9344 15.8495L16.7844 12.9995L5.63438 12.9995C5.35104 12.9995 5.11354 12.9037 4.92188 12.712C4.73021 12.5203 4.63438 12.2828 4.63438 11.9995C4.63438 11.7162 4.73021 11.4787 4.92188 11.287C5.11354 11.0953 5.35104 10.9995 5.63438 10.9995L16.7844 10.9995Z" fill="white"/>
  </g>
</svg>`;
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    });

    const monthLabel = document.createElement("div");
    monthLabel.className = "general-modal-calendar-month-label";
    monthLabel.textContent = currentMonth.toLocaleDateString("default", {
      month: "long",
      year: "numeric",
    });

    header.append(prevBtn, monthLabel, nextBtn);
    calendar.appendChild(header);

    const weekdaysRow = document.createElement("div");
    weekdaysRow.className = "general-modal-calendar-weekdays";
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
      const dayEl = document.createElement("div");
      dayEl.className = "general-modal-calendar-weekday";
      dayEl.textContent = day;
      weekdaysRow.appendChild(dayEl);
    });
    calendar.appendChild(weekdaysRow);

    const grid = document.createElement("div");
    grid.className = "general-modal-calendar-grid";

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className =
        "general-modal-calendar-day general-modal-calendar-empty";
      grid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      date.setHours(0, 0, 0, 0);

      const dayCell = document.createElement("button");
      dayCell.className = "general-modal-calendar-day";
      dayCell.type = "button";
      dayCell.textContent = day;

      if (date < today) {
        dayCell.disabled = true;
        dayCell.classList.add("general-modal-calendar-disabled");
      } else if (isSameDay(date, today)) {
        dayCell.classList.add("general-modal-calendar-today");
      }

      if (tempStart && isSameDay(date, tempStart)) {
        dayCell.classList.add("general-modal-calendar-selected-start");
      }
      if (tempEnd && isSameDay(date, tempEnd)) {
        dayCell.classList.add("general-modal-calendar-selected-end");
      }
      if (isInRange(date, tempStart, tempEnd)) {
        dayCell.classList.add("general-modal-calendar-in-range");
      }

      if (date >= today) {
        dayCell.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!tempStart || (tempStart && tempEnd)) {
            tempStart = date;
            tempEnd = null;
          } else if (date < tempStart) {
            tempEnd = tempStart;
            tempStart = date;
          } else {
            tempEnd = date;
          }
          render();
        });
      }

      grid.appendChild(dayCell);
    }

    calendar.appendChild(grid);

    const doneBtn = document.createElement("button");
    doneBtn.className = "general-modal-calendar-done-btn";
    doneBtn.type = "button";
    doneBtn.textContent = "Done";
    doneBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (tempStart && !tempEnd) {
        tempEnd = tempStart;
      }

      if (tempStart && tempEnd) {
        const startDisplay = formatDateForDisplay(tempStart);
        const startData = formatDateForData(tempStart);
        const endData = formatDateForData(tempEnd);

        if (isSameDay(tempStart, tempEnd)) {
          onSelect({
            display: startDisplay,
            value: startData,
            bookingDate: startData,
            bookingEndDate: startData,
          });
        } else {
          const endDisplay = formatDateForDisplay(tempEnd);
          onSelect({
            display: `${startDisplay} - ${endDisplay}`,
            value: `${startData} - ${endData}`,
            bookingDate: startData,
            bookingEndDate: endData,
          });
        }
      } else {
        onSelect({
          display: "",
          value: "",
          bookingDate: "",
          bookingEndDate: "",
        });
      }

      onDone();
    });

    calendar.appendChild(doneBtn);
  }

  render();
  return calendar;
}
