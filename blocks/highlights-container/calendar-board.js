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

export function createCalendarBoard({
  selectedRange = null,
  onSelect = () => {},
  onDone = () => {},
} = {}) {
  let currentMonth = selectedRange ? new Date(selectedRange[0]) : new Date();
  currentMonth.setDate(1);

  let tempStart = selectedRange ? new Date(selectedRange[0]) : null;
  let tempEnd = selectedRange ? new Date(selectedRange[1]) : null;

  const calendar = document.createElement("div");
  calendar.className = "calendar-dropdown";

  calendar.addEventListener("click", (e) => e.stopPropagation());

  function render() {
    calendar.innerHTML = "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Header
    const header = document.createElement("div");
    header.className = "filter-dropdown-header";

    const left = document.createElement("button");
    left.type = "button";
    left.className = "calendar-nav calendar-nav-left";
    left.setAttribute("aria-label", "Previous month");
    const leftArrowImg = document.createElement("img");
    leftArrowImg.src = "/icons/arrow.svg";
    leftArrowImg.alt = "Previous";
    leftArrowImg.style.filter = "invert(1)";
    left.append(leftArrowImg);

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
    right.className = "calendar-nav calendar-nav-right";
    right.setAttribute("aria-label", "Next month");
    const rightArrowImg = document.createElement("img");
    rightArrowImg.src = "/icons/arrow.svg";
    rightArrowImg.alt = "Next";
    rightArrowImg.style.filter = "invert(1)";
    rightArrowImg.style.transform = "rotate(180deg)";
    right.append(rightArrowImg);
    right.onclick = () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      render();
    };

    const label = document.createElement("span");
    label.className = "calendar-month-label";
    label.textContent = currentMonth.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    header.append(left, label, right);
    calendar.appendChild(header);

    // Days of week (Mon-Sun)
    const daysRow = document.createElement("div");
    daysRow.className = "calendar-days-row";
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach((d) => {
      const el = document.createElement("p");
      el.className = "calendar-day-label";
      el.textContent = d;
      daysRow.appendChild(el);
    });
    calendar.appendChild(daysRow);

    // Dates grid
    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    let firstDay = new Date(currentMonth).getDay();
    if (firstDay === 0) firstDay = 7; // Sunday is 7
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    for (let i = 1; i < firstDay; i++) {
      const blank = document.createElement("div");
      blank.className = "calendar-date-blank";
      grid.appendChild(blank);
    }

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

      if (date < today) {
        btn.disabled = true;
        btn.classList.add("calendar-date-disabled");
      }

      const isSelected = isSameDay(date, tempStart) && isSameDay(date, tempEnd);
      if (isSelected) {
        btn.classList.add("calendar-date-selected");
      } else if (isInRange(date, tempStart, tempEnd)) {
        btn.classList.add("calendar-date-inrange");
      }

      if (isSameDay(date, today)) {
        btn.classList.add("calendar-date-today");
      }

      btn.onclick = () => {
        if (btn.disabled) return;
        if (
          !tempStart ||
          (tempStart && tempEnd && !isSameDay(tempStart, tempEnd))
        ) {
          tempStart = date;
          tempEnd = date;
        } else if (isSameDay(tempStart, tempEnd)) {
          if (isSameDay(date, tempStart)) {
            tempStart = null;
            tempEnd = null;
          } else if (date < tempStart) {
            tempEnd = tempStart;
            tempStart = date;
          } else {
            tempEnd = date;
          }
        }
        render();
      };
      grid.appendChild(btn);
    }
    calendar.appendChild(grid);

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.className = "table-board-filter-done-btn";
    doneBtn.textContent = "Done";
    doneBtn.onclick = () => {
      if (!tempStart && !tempEnd) {
        onSelect([]);
      } else if (tempStart && tempEnd) {
        onSelect([tempStart, tempEnd]);
      }
      onDone();
    };
    calendar.appendChild(doneBtn);
  }

  render();
  return calendar;
}
