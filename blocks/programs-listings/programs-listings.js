import {
  formatDate,
  getDayOfWeek,
  getDestinationFromPath,
  handleEditorEnv,
  expandPrograms,
} from "./programs-listings-utils.js";
import { createCalendar } from "./calendar-component.js";
import {
  createCategoryTabs,
  getDocumentLocale,
  kebabToNormal,
  normalToKebab,
  isExternalLink,
} from "../../scripts/utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  FILTER_PILL_CLASS,
  FILTER_DROPDOWN_CLASS,
  FILTER_DONE_BTN_CLASS,
  FILTER_SELECT_ALL_BTN_CLASS,
  FILTER_WRAPPER_CLASS,
  EVENTS_PER_PAGE,
  EVENTS_API_URL,
  ARTISTS_API_URL,
  ACTIVITY_API_URL,
  FESTIVE_API_URL,
  ACTIVITY_CATEGORIES,
  ARTISTS_CATEGORIES,
  FESTIVE_CATEGORIES,
  placeholders,
  site,
  categoriesMap,
  eventsCategoryMap,
} from "./programs-listings-constants.js";

const wrapper = document.querySelector(".programs-listings-wrapper");

const closeText = placeholders?.globalClose || "CLOSE";

let programTypeSelected = "event"; // "activity" || "event" || "artist" || "festive"
let activeProgram; // {authoringObject}
let highlightProgram = null;
let highlightFound = false; // true if a highlight program was found (for activity highlight)
let artistProgramData,
  eventProgramData,
  activityProgramData,
  festiveProgramData; // [allProgram]
let activeProgramData;

// Function to sort programs alphabetically by category first, then by title
function sortProgramsAlphabetically(programs) {
  return programs.sort((a, b) => {
    // First sort by category
    const categoryA = (a.category || "").toLowerCase();
    const categoryB = (b.category || "").toLowerCase();

    if (categoryA !== categoryB) {
      return categoryA.localeCompare(categoryB);
    }

    // If categories are the same, sort by title
    const titleA = (a.title || "").toLowerCase();
    const titleB = (b.title || "").toLowerCase();

    return titleA.localeCompare(titleB);
  });
}

function createProgramModal() {
  // Create modal element
  let modal = document.createElement("div");
  modal.className = "program-modal";
  modal.innerHTML = `
    <div class="program-modal-content">
      <div class="program-modal-image"></div>
    <div class="program-modal-text"></div>
    <button class="program-modal-close desktop text-b icon-left" aria-label="Close modal">
        <img src="/icons/close-icon.svg" alt="Close" />
        <span class="animate-underline">${closeText}</span>
      </button>
      </div>
      <button class="program-modal-close mobile text-b icon-left" aria-label="Close modal">
        <img src="/icons/close-icon.svg" alt="Close" />
        <span class="animate-underline">${closeText}</span>
      </button>
  `;
  document.body.appendChild(modal);
  return modal;
}

function showProgramModal(programData) {
  let modal = document.querySelector(".program-modal");
  if (!modal) modal = createProgramModal();
  // Fill modal content
  const imgUrl =
    programData.images && programData.images.length > 0
      ? programData.images[programData.imageIdx || 0]._publishUrl
      : "";
  const category = programData.category || "";
  const title = programData.modalTitle || programData.title || "";
  const description = programData?.modalDescription?.plaintext || "";
  const venue = programData.venue || "";
  const ctaText = programData.ctaText || "";
  const ctaLink = programData.ctaLink || "";
  const date = programData.date || "";

  // Dates
  let dateStr = "";
  if (programData.dateRange && programData.dateRange.length === 2) {
    dateStr = `${formatDate(programData.dateRange[0])} - ${formatDate(
      programData.dateRange[1]
    )}`;
  } else if (programData.dateRange && programData.dateRange.length === 1) {
    dateStr = formatDate(programData.dateRange[0]);
  } else if (programData.date) {
    dateStr = formatDate(programData.date);
  }

  const timing = programData.timing || "";

  // Fill image
  modal.querySelector(".program-modal-image").innerHTML = imgUrl
    ? `<img src="${imgUrl}" alt="${title}" />`
    : "";

  // Fill details
  // Hide date, time, and venue if activityFilter is 'resort'
  let showDetails =
    typeof window !== "undefined" && window.activityFilter === "activity"
      ? false
      : typeof programTypeSelected !== "undefined" &&
        programTypeSelected === "activity";

  // Fallback: try to get activityFilter from closure if available
  if (typeof programTypeSelected !== "undefined") {
    showDetails = programTypeSelected !== "activity";
  }
  // Replace line breaks in description with <br>
  const formattedDescription = description
    ? description.replace(/\n/g, "<br>")
    : "";
  modal.querySelector(".program-modal-text").innerHTML = `
    ${
      category &&
      `<p class="program-modal-category text-l2">${
        programTypeSelected === "activity" ||
        programTypeSelected === "artist" ||
        programTypeSelected === "festive"
          ? categoriesMap[programTypeSelected]?.[category] || ""
          : categoriesMap.events[site].categories[category.toLowerCase()] || ""
      }</p>`
    }
    <h3 class="program-modal-title text-h3">${title}</h3>
          ${
            date && programTypeSelected === "festive"
              ? `<p class="program-modal-dates calendar-icon text-p2 festive">${
                  date || ""
                }</p>`
              : ""
          }
    ${
      formattedDescription
        ? `<p class="program-modal-desc text-p2">${formattedDescription}</p>`
        : ""
    }
    ${
      timing || venue || dateStr
        ? `<div class="program-modal-details">
      ${
        showDetails && dateStr && programTypeSelected === "event"
          ? `<p class="program-modal-dates calendar-icon text-p2">${dateStr}</p>`
          : ""
      }
      ${
        showDetails && timing
          ? `<p class="program-modal-timing clock-icon text-p2">${timing}</p>`
          : ""
      }
      ${
        showDetails && venue
          ? `<p class="program-modal-venue venue-icon text-p2">${venue}</p>`
          : ""
      }
    </div> `
        : ""
    }
    ${
      ctaText && ctaLink
        ? `<a class="program-modal-cta cta-link chevron-right icon-black text-b" href="${ctaLink}" target=${
            isExternalLink(ctaLink) ? "_blank" : "_self"
          }><span class="animate-underline">${ctaText}</span></a>`
        : ctaText
        ? `<p class="program-modal-cta text-b">${ctaText}</p>`
        : ""
    }
  `;

  // Show modal with fade-in
  modal.classList.add("active");
  modal.classList.remove("inactive");

  // Close logic
  function closeModal() {
    modal.classList.remove("active");
    modal.classList.add("inactive");
  }

  modal.querySelector(".program-modal-close").onclick = closeModal;

  // Close when clicking outside modal-content
  modal.onclick = (e) => {
    if (!modal.querySelector(".program-modal-content").contains(e.target)) {
      closeModal();
    }
  };

  // Close on Escape key
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escHandler);
    }
  });
}

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/programs-listings/programs-listings-author.css`
    );
    const slides = [...block.children];
    handleEditorEnv(slides, block);
    return;
  }

  const programsBlock = [...block.children];
  block.innerHTML = "";

  programTypeSelected = programsBlock[0].children[0].innerText
    .trim()
    .toLowerCase();
  activeProgram = programsBlock[0];

  const findIdxOfProgramType = (type) => {
    return programsBlock.findIndex((program) => {
      const programContent = program.children;
      const programsType = programContent[0].innerText.trim();
      return programsType === type;
    });
  };

  const numOfCols = "4";

  let option = activeProgram.children[3].innerText.trim() === "true";
  let optionSettings = activeProgram.children[4].children;
  let hideFilters = optionSettings[2].innerText.trim() === "true";

  function renderProgramCard(program, dateObj, timing, imageIdx = 0) {
    const imgUrl =
      program?.images && program?.images.length > 0
        ? program?.images?.[imageIdx]?._publishUrl
        : "";
    const date = formatDate(dateObj);
    const dayOfWeek = getDayOfWeek(dateObj);

    // Resort Activity mode: show only image, label, title, description
    if (
      programTypeSelected === "activity" ||
      programTypeSelected === "artist" ||
      programTypeSelected === "festive"
    ) {
      return `
        <section class="program-card">
          <div class="program-image-wrapper">
        ${imgUrl ? `<img src="${imgUrl}" alt="${program.title || ""}" />` : ""}
        ${
          program?.activityTag
            ? `<p class="activity-tag text-l3 bg-brand-sage text-text-white">${program?.activityTag}</p>`
            : ""
        }
          </div>
          <p class="program-category text-l2">${
            categoriesMap[programTypeSelected]?.[program?.category] || ""
          }</p>
          <h3 class="program-title text-h3">${program?.title || ""}</h3>
          ${
            program.date
              ? `<p class="program-card-date calendar-icon text-p2">${
                  program.date || ""
                }</p>`
              : ""
          }
          ${
            program?.description
              ? `<p class="program-desc text-p2">${program?.description}</p>`
              : ""
          }
        </section>
      `;
    }
    // Default to event
    // Remove "年" from date string if present
    let displayDate = date.replace(/年/g, "");
    displayDate = displayDate.replace(/,? ?\d{4}/, "");

    return `
      <section class="program-card">
      <div class="program-image-wrapper">
        ${imgUrl ? `<img src="${imgUrl}" alt="${program.title || ""}" />` : ""}
        <div class="program-date-wrapper">
        <p class="program-day text-l3">${dayOfWeek}</p>
        <p class="program-date text-l2">${displayDate}</p>
        </div>
      </div>
      <p class="program-category text-l2">${
        categoriesMap.events[site].categories[program.category.toLowerCase()] ||
        ""
      }</p>
      <h3 class="program-title text-h3">${program.title || ""}</h3>
      <div class="program-details">
      ${
        site === "osaka" && !!timing
          ? `<p class="program-timing clock-icon">${timing}</p>`
          : ""
      }
      ${
        !!program.venue
          ? `<p class="program-venue venue-icon">${program.venue}</p>`
          : ""
      }
      </div>
      </section>
    `;
  }

  let filterState = {
    selected: [], // array of subcategory strings
    allSubcategories: [],
    categories: {}, // { category: [subcategories] }
  };

  // --- Date filter button ---
  // State for date filter
  let dateFilterState = {
    selected: [], // [startDate, endDate] or [singleDate]
  };

  // Create filter wrapper div if not present
  let filterWrapper = document.querySelector(`.${FILTER_WRAPPER_CLASS}`);
  if (!filterWrapper) {
    filterWrapper = document.createElement("div");
    filterWrapper.className = FILTER_WRAPPER_CLASS;

    if (!hideFilters) {
      wrapper.prepend(filterWrapper);
    }
  }

  // Create filter-button-wrapper for category filter if not present
  let catButtonWrapper = filterWrapper.querySelector(
    ".filter-button-wrapper.category"
  );
  if (!catButtonWrapper) {
    catButtonWrapper = document.createElement("div");
    catButtonWrapper.className = "filter-button-wrapper category";
    filterWrapper.appendChild(catButtonWrapper);
  }

  // Create filter-button-wrapper for date filter if not present
  let dateButtonWrapper = filterWrapper.querySelector(
    ".filter-button-wrapper.date"
  );
  if (!dateButtonWrapper) {
    dateButtonWrapper = document.createElement("div");
    dateButtonWrapper.className = "filter-button-wrapper date";
    filterWrapper.appendChild(dateButtonWrapper);
  }

  // Create filter-button-wrapper for destination filter if site is ""
  let destButtonWrapper = null;
  if (site === "") {
    destButtonWrapper = filterWrapper.querySelector(
      ".filter-button-wrapper.destination"
    );
    if (!destButtonWrapper) {
      destButtonWrapper = document.createElement("div");
      destButtonWrapper.className = "filter-button-wrapper destination";
      filterWrapper.prepend(destButtonWrapper);
    }
  }

  function renderFilterPill() {
    let pill = catButtonWrapper.querySelector(`.${FILTER_PILL_CLASS}`);
    if (!pill) {
      pill = document.createElement("button");
      pill.className = FILTER_PILL_CLASS;
      pill.type = "button";
      pill.addEventListener("click", toggleDropdown);
      catButtonWrapper.appendChild(pill);
    }

    pill.textContent = getPillText();

    // Set aria-expanded for chevron animation
    const dropdownOpen = !!catButtonWrapper.querySelector(
      `.${FILTER_DROPDOWN_CLASS}`
    );
    pill.setAttribute("aria-expanded", dropdownOpen ? "true" : "false");
  }

  function getPillText() {
    const sel = filterState.selected;
    const MAX_CHARS = 28;

    function getLabel(sub) {
      // Try to get label from events categories map
      return (
        categoriesMap.events?.[site]?.subcategories?.[normalToKebab(sub)] ||
        categoriesMap.events?.[site]?.categories?.[normalToKebab(sub)] ||
        normalToKebab(sub)
      );
    }

    if (!sel.length || sel.length === filterState.allSubcategories.length)
      return placeholders?.programsEventFilterAll || "All Events";

    if (sel.length === 1) return getLabel(sel[0]);

    if (sel.length === 2 || sel.length === 3) {
      const mappedLabels = sel.map(getLabel);
      const joined = mappedLabels.join(", ");
      if (joined.length > MAX_CHARS) {
        let out = "";
        let i = 0;
        for (; i < mappedLabels.length; i++) {
          const next = (out ? ", " : "") + mappedLabels[i];
          if ((out + next).length > MAX_CHARS) {
            // If nothing has been added yet, still add part of the first item
            if (!out) {
              out = mappedLabels[i].slice(0, MAX_CHARS - 3) + "...";
            } else {
              out +=
                (out ? ", " : "") +
                mappedLabels[i].slice(
                  0,
                  Math.max(0, MAX_CHARS - out.length - (out ? 2 : 0) - 3)
                ) +
                "...";
            }
            break;
          }
          out += next;
        }
        // Only add ", ..." if there are more items not shown
        if (i < sel.length - 1) {
          if (!out.endsWith("...")) out += ", ...";
        }
        return out;
      }
      return joined;
    }

    return `${sel.length} Selected`;
  }

  function toggleDropdown() {
    let dropdown = catButtonWrapper.querySelector(`.${FILTER_DROPDOWN_CLASS}`);
    if (dropdown) {
      dropdown.setAttribute("aria-open", "false");
      setTimeout(() => {
        dropdown.remove();
        document.removeEventListener("mousedown", handleOutsideClick, true);
        renderFilterPill(); // update chevron
      }, 350); // match transition duration
      return;
    }

    dropdown = document.createElement("div");
    dropdown.className = FILTER_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    // Build dropdown content
    let html = `<div class="filter-dropdown-inner">`;
    html += `<div class="filter-dropdown-header"><p class="text-l2">${
      placeholders?.programsEventFilterHeader || "Select Event"
    }</p><button type="button" class="${FILTER_SELECT_ALL_BTN_CLASS} text-l3 text-text-white">${
      filterState.selected.length === filterState.allSubcategories.length
        ? placeholders?.programsEventFilterDeselectAll || "Deselect All"
        : placeholders?.programsEventFilterSelectAll || "Select All"
    }</button></div>`;

    Object.entries(filterState.categories).forEach(([cat, subs]) => {
      html += `<div class="filter-category text-l3"><div class="filter-category-title">${subs.label}</div>`;
      subs.subcategories.forEach((sub) => {
        const checked = filterState.selected.includes(sub.value)
          ? "checked"
          : "";
        html += `<label class="filter-subcategory text-l2"> ${sub.label}<input type="checkbox" value="${sub.value}" ${checked}/></label>`;
      });
      html += `</div>`;
    });

    html += `<button type="button" class="${FILTER_DONE_BTN_CLASS} cta-button">${
      placeholders?.filterConfirmButton || "Done"
    }</button>`;
    html += `</div>`;

    dropdown.innerHTML = html;
    catButtonWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
    }, 10);

    renderFilterPill(); // update chevron

    // Add outside click handler
    function handleOutsideClick(e) {
      if (
        !dropdown.contains(e.target) &&
        !catButtonWrapper
          .querySelector(`.${FILTER_PILL_CLASS}`)
          .contains(e.target)
      ) {
        dropdown.setAttribute("aria-open", "false");
        setTimeout(() => {
          if (dropdown.parentNode) dropdown.remove();
          document.removeEventListener("mousedown", handleOutsideClick, true);
          renderFilterPill();
        }, 350);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick, true);

    // Add listeners
    dropdown.querySelectorAll("input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const val = e.target.value;
        if (e.target.checked) {
          if (!filterState.selected.includes(val))
            filterState.selected.push(val);
        } else {
          filterState.selected = filterState.selected.filter((s) => s !== val);
        }
        renderFilterPill();

        // Update select all button text
        const selectAllBtn = dropdown.querySelector(
          `.${FILTER_SELECT_ALL_BTN_CLASS}`
        );
        if (selectAllBtn)
          selectAllBtn.textContent =
            filterState.selected.length === filterState.allSubcategories.length
              ? placeholders?.programsEventFilterDeselectAll || "Deselect All"
              : placeholders?.programsEventFilterSelectAll || "Select All";
      });
    });

    dropdown
      .querySelector(`.${FILTER_DONE_BTN_CLASS}`)
      .addEventListener("click", () => {
        dropdown.remove();
        renderPrograms(activeProgramData);
      });

    dropdown
      .querySelector(`.${FILTER_SELECT_ALL_BTN_CLASS}`)
      .addEventListener("click", () => {
        if (
          filterState.selected.length === filterState.allSubcategories.length
        ) {
          filterState.selected = [];
        } else {
          filterState.selected = [...filterState.allSubcategories];
        }

        // Update all checkboxes
        dropdown.querySelectorAll("input[type=checkbox]").forEach((cb) => {
          cb.checked = filterState.selected.includes(cb.value);
        });

        renderFilterPill();

        // Update select all button text
        const selectAllBtn = dropdown.querySelector(
          `.${FILTER_SELECT_ALL_BTN_CLASS}`
        );
        if (selectAllBtn)
          selectAllBtn.textContent =
            filterState.selected.length === filterState.allSubcategories.length
              ? placeholders?.programsEventFilterDeselectAll || "Deselect All"
              : placeholders?.programsEventFilterSelectAll || "Select All";
      });
  }

  // Update renderDateFilterPill and toggleDateDropdown to use dateButtonWrapper
  function renderDateFilterPill() {
    let pill = dateButtonWrapper.querySelector(".date-filter-pill");
    if (!pill) {
      pill = document.createElement("button");
      pill.className = FILTER_PILL_CLASS + " date-filter-pill";
      pill.type = "button";
      pill.addEventListener("click", toggleDateDropdown);
      dateButtonWrapper.appendChild(pill);
    }

    pill.textContent = getDatePillText();

    // Set aria-expanded for chevron animation
    const dropdownOpen =
      !!dateButtonWrapper.querySelector(".calendar-dropdown");
    pill.setAttribute("aria-expanded", dropdownOpen ? "true" : "false");
  }

  function getDatePillText() {
    if (!dateFilterState.selected.length) {
      const eventDateFilterAdditionalFrontText =
        placeholders?.eventDateFilterAdditionalFrontText || "" + " ";
      const eventDateFilterAdditionalBackText =
        placeholders?.eventDateFilterAdditionalBackText
          ? " " + placeholders.eventDateFilterAdditionalBackText
          : "";

      // Default: today
      const today = new Date();
      const locale = getDocumentLocale();
      return (
        eventDateFilterAdditionalFrontText +
        today.toLocaleDateString(locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        eventDateFilterAdditionalBackText
      );
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

  function toggleDateDropdown() {
    let dropdown = dateButtonWrapper.querySelector(".calendar-dropdown");
    if (dropdown) {
      dropdown.setAttribute("aria-open", "false");
      setTimeout(() => {
        dropdown.remove();
        document.removeEventListener("mousedown", handleOutsideClick, true);
        renderDateFilterPill();
      }, 350);
      return;
    }

    // Create calendar dropdown
    dropdown = createCalendar({
      selectedDate: dateFilterState.selected[0] || new Date(),
      selectedRange:
        dateFilterState.selected.length === 2 ? dateFilterState.selected : null,
      onSelect: (result) => {
        // Handle the new format from calendar component
        if (!result.value) {
          // No selection
          dateFilterState.selected = [];
        } else if (result.value.includes(" - ")) {
          // Date range
          const [startStr, endStr] = result.value.split(" - ");
          dateFilterState.selected = [new Date(startStr), new Date(endStr)];
        } else {
          // Single date
          dateFilterState.selected = [new Date(result.value)];
        }
      },
      onDone: () => {
        dropdown.remove();
        renderDateFilterPill();
        renderPrograms(activeProgramData);
      },
      placeholders,
    });

    dateButtonWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
    }, 10);

    renderDateFilterPill();

    function handleOutsideClick(e) {
      if (
        !dropdown.contains(e.target) &&
        !dateButtonWrapper.querySelector(".date-filter-pill").contains(e.target)
      ) {
        dropdown.setAttribute("aria-open", "false");
        setTimeout(() => {
          if (dropdown.parentNode) dropdown.remove();
          document.removeEventListener("mousedown", handleOutsideClick, true);
          renderDateFilterPill();
        }, 350);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick, true);
  }

  const DESTINATIONS = [
    { label: "All Destinations", value: "all" },
    { label: "Osaka", value: "osaka" },
    { label: "Maldives", value: "maldives" },
  ];

  let destinationFilter = "all";

  function renderDestinationFilterPill() {
    if (!destButtonWrapper) return;

    let pill = destButtonWrapper.querySelector(".destination-filter-pill");
    if (!pill) {
      pill = document.createElement("button");
      pill.className = FILTER_PILL_CLASS + " destination-filter-pill";
      pill.type = "button";
      pill.addEventListener("click", toggleDestinationDropdown);
      destButtonWrapper.appendChild(pill);
    }

    pill.textContent =
      DESTINATIONS.find((d) => d.value === destinationFilter)?.label ||
      "All Destinations";

    const dropdownOpen = !!destButtonWrapper.querySelector(
      ".programs-filter-dropdown"
    );
    pill.setAttribute("aria-expanded", dropdownOpen ? "true" : "false");
  }

  function toggleDestinationDropdown() {
    let dropdown = destButtonWrapper.querySelector(".programs-filter-dropdown");
    if (dropdown) {
      dropdown.setAttribute("aria-open", "false");
      setTimeout(() => {
        dropdown.remove();
        document.removeEventListener("mousedown", handleOutsideClick, true);
        renderDestinationFilterPill();
      }, 350);
      return;
    }

    dropdown = document.createElement("div");
    dropdown.className = "programs-filter-dropdown";
    dropdown.setAttribute("aria-open", "false");

    let html = `<div class="filter-dropdown-inner">`;
    DESTINATIONS.forEach((dest) => {
      html += `<label class="filter-subcategory text-l2"> <span>${
        dest.label
      }</span><input type="radio" name="destination" value="${dest.value}" ${
        destinationFilter === dest.value ? "checked" : ""
      }/></label>`;
    });
    html += `</div>`;

    dropdown.innerHTML = html;
    destButtonWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
    }, 10);

    renderDestinationFilterPill();

    function handleOutsideClick(e) {
      if (
        !dropdown.contains(e.target) &&
        !destButtonWrapper
          .querySelector(".destination-filter-pill")
          .contains(e.target)
      ) {
        dropdown.setAttribute("aria-open", "false");
        setTimeout(() => {
          if (dropdown.parentNode) dropdown.remove();
          document.removeEventListener("mousedown", handleOutsideClick, true);
          renderDestinationFilterPill();
        }, 350);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick, true);

    dropdown.querySelectorAll("input[type=radio]").forEach((rb) => {
      rb.addEventListener("change", (e) => {
        destinationFilter = e.target.value;
        dropdown.remove();
        renderDestinationFilterPill();
        renderPrograms(activeProgramData);
      });
    });
  }

  function renderHighlightBanner(cardContent) {
    const existingSection = document.querySelector(".programs-banner");
    if (existingSection) {
      if (
        programTypeSelected === "activity" &&
        activityCategoryFilter == "all"
      ) {
        setTimeout(() => {
          existingSection.style.display = "block";
          setTimeout(() => {
            existingSection.style.transition =
              "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
            existingSection.style.opacity = "1";
          }, 200);
        }, 200);
      } else {
        existingSection.style.transition =
          "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
        existingSection.style.opacity = "0";
        setTimeout(() => {
          existingSection.style.display = "none";
        }, 400);
      }
    }
    if (existingSection || !cardContent) return;

    const newSection = document.createElement("section");
    if (programTypeSelected !== "activity") {
      newSection.style.display = "none";
      newSection.style.opacity = "0";
    }
    newSection.className = "programs-banner";
    newSection.innerHTML = `<div class="container">
        <img src="${cardContent?.images?.[0]?._publishUrl}" alt="${
      cardContent?.title
    }" />
        ${
          cardContent?.activityTag
            ? `<p class="activity-tag text-l3 bg-brand-sage text-text-white">${cardContent?.activityTag}</p>`
            : ""
        }
      <div class="text-content">
      <p class="text-l2 text-text-white">${kebabToNormal(
        categoriesMap[programTypeSelected]?.[cardContent?.category] ||
          cardContent?.category
      )}</p>
      <h2 class="text-h1 text-text-white">${cardContent?.title}</h2>
      ${
        cardContent.description
          ? `<p class="text-p1 text-text-white">${cardContent?.description}</p>`
          : ""
      }
      </div>
    </div>`;

    const filterWrapper = document.querySelector(".programs-filter-container");
    if (filterWrapper && filterWrapper.parentNode) {
      filterWrapper.parentNode.insertBefore(
        newSection,
        filterWrapper.nextSibling
      );
    }

    newSection.onclick = (e) => {
      e.stopPropagation();
      showProgramModal({ ...cardContent });
    };
  }

  function renderSectionTitle() {
    // If the section already exists, remove it
    const existingSection = document.querySelector(".programs-section-title");
    if (existingSection) existingSection.remove();

    const content = activeProgram.children[2].children;
    if (content.length === 0) return;
    const section = document.createElement("section");
    section.className = "programs-section-title";
    section.innerHTML = `<div class="container">
      ${
        content[0]
          ? `<h2 class="text-h1">${content[0].innerText.trim()}</h2>`
          : ""
      }
      ${
        content[1]
          ? `<p class="text-p1">${content[1].innerText.trim()}</p>`
          : ""
      }
    </div>`;

    const filterWrapper = document.querySelector(".programs-listings-wrapper");
    filterWrapper.prepend(section);
  }

  function renderProgramsTab() {
    if (programsBlock.length < 2) return; // Dont render if programs type is less than 2

    // Always remove any existing tab wrapper first to prevent duplicates
    let oldTabWrapper = document.querySelector(".activity-tabs-wrapper");
    if (oldTabWrapper) oldTabWrapper.remove();

    // Create tab wrapper
    let tabWrapper = document.createElement("div");
    tabWrapper.className = "activity-tabs-wrapper";
    tabWrapper.style.display = "flex";
    tabWrapper.style.gap = "8px";

    // Tab data
    const tabs = programsBlock.map((program) => {
      return {
        value: program.children[0].innerText.trim(),
        label: program.children[1].innerText.trim(),
      };
    });

    const tabContainer = document.createElement("div");
    tabContainer.className = "activity-tabs-inner";
    tabWrapper.appendChild(tabContainer);

    // Responsive: render tabs initially and re-render on window resize
    function renderTabs() {
      // Remove old tabs
      tabContainer.innerHTML = "";
      const isMobile = window.innerWidth <= 768;

      createCategoryTabs(
        tabContainer,
        tabs,
        (selected) => {
          if (programTypeSelected !== selected) {
            programTypeSelected = selected;
            activeProgram =
              programsBlock[findIdxOfProgramType(programTypeSelected)];
            if (programTypeSelected === "activity") {
              activeProgramData = activityProgramData;
            } else if (programTypeSelected === "artist") {
              activeProgramData = artistProgramData;
            } else if (programTypeSelected === "event") {
              activeProgramData = eventProgramData;
            } else if (programTypeSelected === "festive") {
              activeProgramData = festiveProgramData;
            }
            renderPrograms(activeProgramData);
          }
        },
        programTypeSelected
      );
    }

    // Initial render
    renderTabs();
    let lastIsMobile = window.innerWidth <= 768;
    window.addEventListener("resize", () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile !== lastIsMobile) {
        renderTabs();
        lastIsMobile = isMobile;
      }
    });

    // Insert at the very top of the body or main wrapper to ensure it's at the top of the page
    // If there's a main wrapper, insert before it; otherwise, prepend to body
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(tabWrapper, wrapper);
    } else {
      document.body.prepend(tabWrapper);
    }
  }

  function renderCategoryTypeFilter() {
    let wrapperEl = filterWrapper.querySelector(
      ".filter-button-wrapper.activity-type"
    );
    if (!wrapperEl) {
      wrapperEl = document.createElement("div");
      wrapperEl.className = "filter-button-wrapper activity-type";
      // Always insert after catButtonWrapper for consistent DOM order
      catButtonWrapper.after(wrapperEl);
    }

    // Only show if programTypeSelected === "activity" || programTypeSelected === "artist"
    if (
      programTypeSelected !== "activity" &&
      programTypeSelected !== "artist" &&
      programTypeSelected !== "festive"
    ) {
      wrapperEl.style.display = "none";
      // Remove any children to reset state for next time
      wrapperEl.innerHTML = "";
      return;
    }

    wrapperEl.style.display = "";

    let pill = wrapperEl.querySelector(".activity-category-type-filter-pill");
    if (!pill) {
      pill = document.createElement("button");
      pill.className =
        FILTER_PILL_CLASS + " activity-category-type-filter-pill";
      pill.type = "button";
      pill.addEventListener("click", toggleCategoryTypeDropdown);
      wrapperEl.appendChild(pill);
    }

    pill.textContent = getCategoryTypePillText();

    const dropdownOpen = !!wrapperEl.querySelector(".programs-filter-dropdown");
    pill.setAttribute("aria-expanded", dropdownOpen ? "true" : "false");
  }

  let activityCategoryFilter = "all";

  function getCategoryTypePillText() {
    if (programTypeSelected === "artist") {
      const found = ARTISTS_CATEGORIES.find(
        (c) => c.value === activityCategoryFilter
      );
      return found
        ? found.label
        : placeholders?.programsArtistFilterPlaceholder || "Full Line Up";
    } else if (programTypeSelected === "activity") {
      const found = ACTIVITY_CATEGORIES.find(
        (c) => c.value === activityCategoryFilter
      );
      return found
        ? found.label
        : placeholders?.programsActivityFilterPlaceholder || "All Activities";
    } else if (programTypeSelected === "festive") {
      const found = FESTIVE_CATEGORIES.find(
        (c) => c.value === activityCategoryFilter
      );
      return found
        ? found.label
        : placeholders?.programsFestiveFilterPlaceholder ||
            "All Oceanic Festivities";
    }
    return "";
  }

  function toggleCategoryTypeDropdown() {
    let wrapperEl = filterWrapper.querySelector(
      ".filter-button-wrapper.activity-type"
    );
    let dropdown = wrapperEl.querySelector(".programs-filter-dropdown");
    if (dropdown) {
      dropdown.setAttribute("aria-open", "false");
      setTimeout(() => {
        dropdown.remove();
        document.removeEventListener("mousedown", handleOutsideClick, true);
        renderCategoryTypeFilter();
      }, 350);
      return;
    }

    dropdown = document.createElement("div");
    dropdown.className = "programs-filter-dropdown";
    dropdown.setAttribute("aria-open", "false");

    let html = `<div class="filter-dropdown-inner">`;
    if (programTypeSelected === "artist") {
      ARTISTS_CATEGORIES.forEach((cat) => {
        html += `<label class="filter-subcategory text-l2"><span>${
          cat.label
        }</span><input type="radio" name="activity-category" value="${
          cat.value
        }" ${activityCategoryFilter === cat.value ? "checked" : ""}/></label>`;
      });
    } else if (programTypeSelected === "activity") {
      ACTIVITY_CATEGORIES.forEach((cat) => {
        html += `<label class="filter-subcategory text-l2"><span>${
          cat.label
        }</span><input type="radio" name="activity-category" value="${
          cat.value
        }" ${activityCategoryFilter === cat.value ? "checked" : ""}/></label>`;
      });
    } else if (programTypeSelected === "festive") {
      FESTIVE_CATEGORIES.forEach((cat) => {
        html += `<label class="filter-subcategory text-l2"><span>${
          cat.label
        }</span><input type="radio" name="activity-category" value="${
          cat.value
        }" ${activityCategoryFilter === cat.value ? "checked" : ""}/></label>`;
      });
    }
    html += `</div>`;

    dropdown.innerHTML = html;
    wrapperEl.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
    }, 10);

    renderCategoryTypeFilter();

    function handleOutsideClick(e) {
      if (
        !dropdown.contains(e.target) &&
        !wrapperEl
          .querySelector(".activity-category-type-filter-pill")
          .contains(e.target)
      ) {
        dropdown.setAttribute("aria-open", "false");
        setTimeout(() => {
          if (dropdown.parentNode) dropdown.remove();
          document.removeEventListener("mousedown", handleOutsideClick, true);
          renderCategoryTypeFilter();
        }, 350);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick, true);

    dropdown.querySelectorAll("input[type=radio]").forEach((rb) => {
      rb.addEventListener("change", (e) => {
        activityCategoryFilter = e.target.value;
        dropdown.remove();
        renderCategoryTypeFilter();
        renderPrograms(activeProgramData);
      });
    });
  }

  // --- Filter logic ---
  // Filter programs based on selected criteria
  function filterPrograms(programs) {
    let filtered = programs;

    // Destination filter
    if (site === "" && destinationFilter !== "all") {
      filtered = filtered.filter((program) => {
        const path = program._path || "";
        return getDestinationFromPath(path) === destinationFilter;
      });
    }

    // Activity filter logic
    if (programTypeSelected === "activity") {
      if (activityCategoryFilter !== "all") {
        filtered = filtered.filter(
          (program) => program.category === activityCategoryFilter
        );
      }
      return filtered;
    } else if (programTypeSelected === "artist") {
      if (activityCategoryFilter !== "all") {
        filtered = filtered.filter(
          (program) => program.category === activityCategoryFilter
        );
      }
      return filtered;
    } else if (programTypeSelected === "festive") {
      if (activityCategoryFilter !== "all") {
        filtered = filtered.filter(
          (program) => program.category === activityCategoryFilter
        );
      }
      return filtered;
    }

    // Exclude programs with activity-type tag (unless in Resort Activity mode)
    filtered = filtered.filter((program) => {
      if (!Array.isArray(program._tags)) return true;
      return !program._tags.some((tag) => tag.includes("activity-type"));
    });

    // Subcategory filter
    if (
      !filterState.selected.length ||
      filterState.selected.length === filterState.allSubcategories.length
    )
      return filtered;

    return filtered.filter((program) => {
      if (!program.subcategory) return false;
      let subs = program.subcategory;
      if (typeof subs === "string") {
        subs = subs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(subs)) subs = [subs];

      return subs.some((sub) => filterState.selected.includes(sub));
    });
  }

  // Update renderPrograms to call renderDateFilterPill
  function renderPrograms(programs) {
    option = activeProgram.children[3].innerText.trim() === "true";
    optionSettings = activeProgram.children[4].children;
    hideFilters = optionSettings[2].innerText.trim() === "true";

    if (site === "") {
      if (!hideFilters) {
        renderDestinationFilterPill();
      }
    }

    renderSectionTitle();

    // Prevent rerender: only render activity filter pill if not already present
    if (!hideFilters) {
      if (!document.querySelector(".activity-tabs-wrapper")) {
        renderProgramsTab();
      }
    }

    if (
      programTypeSelected === "activity" ||
      programTypeSelected === "artist" ||
      programTypeSelected === "festive"
    ) {
      if (!hideFilters) {
        renderCategoryTypeFilter();
      }
      dateButtonWrapper.style.display = "none";
      if (destButtonWrapper !== null) {
        destButtonWrapper.style.display = "none";
      }
      catButtonWrapper.style.display = "none";
    } else {
      // Always reset category filter pill and dropdown to original
      catButtonWrapper.innerHTML = "";
      catButtonWrapper.style.display = "";
      if (!hideFilters) {
        renderFilterPill();
      }

      dateButtonWrapper.style.display = "";
      if (destButtonWrapper !== null) destButtonWrapper.style.display = "";

      // Hide activity type filter if not resort
      const wrapperEl = filterWrapper.querySelector(
        ".filter-button-wrapper.activity-type"
      );
      if (wrapperEl) wrapperEl.style.display = "none";
    }

    if (!hideFilters) {
      renderDateFilterPill();
    }

    const container = document.querySelector(".programs-listings");
    if (!container) return;
    container.style.gridTemplateColumns = `repeat(${numOfCols}, 1fr)`;

    // Fade out
    container.style.transition = "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    container.style.opacity = "0";

    /* ---------------------- Find the highlighted program ---------------------- */

    if (!highlightFound) {
      const highlightIndex = programs.findIndex(
        (program) => program.highlightActivity
      );

      if (highlightIndex !== -1) {
        highlightFound = true;
        highlightProgram = programs[highlightIndex];
      }
    }

    renderHighlightBanner(highlightProgram);
    console.log(highlightProgram);

    setTimeout(() => {
      let expanded;
      if (
        programTypeSelected === "activity" ||
        programTypeSelected === "artist" ||
        programTypeSelected === "festive"
      ) {
        // Resort Activity or Artist: ignore expandPrograms, just show filtered programs once
        expanded = filterPrograms(programs).map((program) => ({
          ...program,
          date: program.date || null,
          timing: null,
        }));

        // Sort by activity tag
        if (programTypeSelected === "activity") {
          if (
            highlightFound &&
            activityCategoryFilter === "all" &&
            highlightProgram
          ) {
            expanded = filterPrograms(programs)
              .filter((program) => program !== highlightProgram)
              .map((program) => ({
                ...program,
                date: null,
                timing: null,
              }));
          }

          expanded.sort((a, b) => {
            const aTag = a.activityTag || a.program?.activityTag;
            const bTag = b.activityTag || b.program?.activityTag;
            if (aTag && !bTag) return -1;
            if (!aTag && bTag) return 1;
            return 0;
          });

          // If highlight found and activityCategoryFilter === "all", filter out highlightProgram
        }
      } else {
        expanded = expandPrograms(programs);
      }

      // Sort by date ascending and filter out past programs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let toRenderPrograms;
      if (programTypeSelected === "event") {
        toRenderPrograms = expanded.filter(({ date }) => {
          if (!date) return true;
          const programDate = new Date(date);
          programDate.setHours(0, 0, 0, 0);
          return programDate >= today;
        });

        // Filter by subcategory
        toRenderPrograms = toRenderPrograms.filter(
          ({ program }) => filterPrograms([program]).length
        );

        // Filter by date
        if (dateFilterState.selected.length === 1) {
          const d = dateFilterState.selected[0];
          toRenderPrograms = toRenderPrograms.filter(({ date }) => {
            if (!date) return false;
            const programDate = new Date(date);
            programDate.setHours(0, 0, 0, 0);
            return programDate.getTime() === d.setHours(0, 0, 0, 0);
          });
        } else if (dateFilterState.selected.length === 2) {
          const [start, end] = dateFilterState.selected;
          const startTime = start.setHours(0, 0, 0, 0);
          const endTime = end.setHours(0, 0, 0, 0);
          toRenderPrograms = toRenderPrograms.filter(({ date }) => {
            if (!date) return false;
            const programDate = new Date(date);
            programDate.setHours(0, 0, 0, 0);
            const t = programDate.getTime();
            return t >= startTime && t <= endTime;
          });
        }

        toRenderPrograms.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        });
      } else {
        toRenderPrograms = expanded.map((program) => ({
          program,
          date: program.date || null,
          timing: null,
        }));
      }

      const link = activeProgram?.children[6]?.children[0]?.children[0];

      if (!toRenderPrograms || toRenderPrograms.length === 0) {
        container.innerHTML = `<div class="no-programs-message">
        <h2 class="text-h1">${
          (option && activeProgram?.children[5]?.textContent) ||
          "No hosted experiences today, wander at will"
        }</h2>
        <a class="cta-link split-text arrow-right" href=${
          (option && link?.href) || "/newsletter"
        }><span class="animate-underline">${
          (option && link?.textContent) || "Know when experiences arrive"
        }</span></a>
        </div>`;

        // Remove pagination if present
        const oldPagination = wrapper.querySelector(".programs-pagination");
        if (oldPagination) oldPagination.remove();

        // Fade in
        setTimeout(() => {
          container.style.opacity = "1";
        }, 10);
        return;
      } else {
        const message = document.querySelector(".no-programs-message");
        if (message) {
          message.style.display = "none";
        }
      }

      const pageSize = EVENTS_PER_PAGE;
      let currentPage = 1;
      const totalPages = Math.ceil(toRenderPrograms.length / pageSize);
      function renderPage(page) {
        const maxPrograms = +optionSettings[1].innerText.trim();
        const start = (page - 1) * pageSize;
        const end =
          option && maxPrograms !== 0 && maxPrograms < pageSize
            ? maxPrograms
            : start + pageSize;
        const container = document.querySelector(".programs-listings");
        const existingProgramTypes = container.querySelector(".programs-types");

        if (existingProgramTypes) existingProgramTypes.remove();

        const programTypes = document.createElement("div");
        programTypes.className = "programs-types";

        // If option is true

        if (option) {
          const columnNum = optionSettings[0].innerText.trim();
          programTypes.style.gridTemplateColumns = `repeat(${columnNum}, 1fr)`;
        }
        container.appendChild(programTypes);
        programTypes.innerHTML = toRenderPrograms
          .slice(start, end)
          .map(({ program, date, timing, imageIdx }) =>
            renderProgramCard(program, date, timing, imageIdx)
          )
          .join("");

        if (!option || maxPrograms === 0) {
          renderPagination(page);
        } else {
          if (maxPrograms > EVENTS_PER_PAGE) {
            renderPagination(page);
          }
        }

        // Add click program to program-image-wrapper and program-title only
        container.querySelectorAll(".program-card").forEach((card, idx) => {
          const { program, date, timing, imageIdx } =
            toRenderPrograms[start + idx];
          // Build dateRange if available
          let dateRange = [];
          if (programTypeSelected === "event") {
            if (program.dailyStartDate && program.dailyEndDate) {
              dateRange = [program.dailyStartDate, program.dailyEndDate];
            } else if (program.weeklyStartDate && program.weeklyEndDate) {
              dateRange = [program.weeklyStartDate, program.weeklyEndDate];
            } else if (program.monthlyStartDate && program.monthlyEndDate) {
              dateRange = [program.monthlyStartDate, program.monthlyEndDate];
            } else if (date) {
              dateRange = [date];
            }
          }

          // Only attach modal open to image and title
          const imageWrapper = card.querySelector(".program-image-wrapper");
          const titleEl = card.querySelector(".program-title");
          if (imageWrapper) {
            imageWrapper.onclick = (e) => {
              e.stopPropagation();
              showProgramModal({
                ...program,
                dateRange,
                date,
                timing,
                imageIdx,
              });
            };
          }

          if (titleEl) {
            titleEl.onclick = (e) => {
              e.stopPropagation();
              showProgramModal({
                ...program,
                dateRange,
                date,
                timing,
                imageIdx,
              });
            };
          }
        });

        // Fade in after content update
        setTimeout(() => {
          container.style.opacity = "1";
        }, 10);
      }

      function renderPagination(page) {
        // Remove existing pagination if present
        const oldPagination = wrapper.querySelector(".programs-pagination");
        if (oldPagination) oldPagination.remove();

        if (totalPages <= 1) return;

        const pagination = document.createElement("div");
        pagination.className = "programs-pagination";

        // Left arrow
        const leftArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left h-4 w-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>`;
        const leftArrow = document.createElement("button");
        leftArrow.innerHTML = leftArrowSvg;
        leftArrow.disabled = page === 1;
        leftArrow.className = "arrow-btn left-arrow";
        leftArrow.addEventListener("click", () => {
          if (page > 1) {
            currentPage = page - 1;
            // Fade out before changing page
            container.style.opacity = "0";
            setTimeout(() => {
              renderPage(currentPage);
            }, 400);
          }
          scrollToProgramsFilter();
        });
        pagination.appendChild(leftArrow);

        // Helper to add a button
        function addBtn(i, isActive = false) {
          const btn = document.createElement("button");
          btn.textContent = i;
          if (isActive) btn.classList.add("active");
          btn.addEventListener("click", () => {
            currentPage = i;
            // Fade out before changing page
            container.style.opacity = "0";
            setTimeout(() => {
              renderPage(currentPage);
            }, 400);
            scrollToProgramsFilter();
          });
          pagination.appendChild(btn);
        }

        // Helper to add ellipsis
        function addEllipsis() {
          const span = document.createElement("span");
          span.textContent = "...";
          span.className = "pagination-ellipsis";
          pagination.appendChild(span);
        }

        // Pagination logic
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) addBtn(i, i === page);
        } else {
          addBtn(1, page === 1);

          if (page <= 2) {
            for (let i = 2; i <= 3; i++) addBtn(i, i === page);
            addEllipsis();
            addBtn(totalPages);
          } else if (page === 3) {
            addBtn(2);
            addBtn(3, true);
            addBtn(4);
            addEllipsis();
            addBtn(totalPages);
          } else if (page >= totalPages - 2) {
            addEllipsis();
            for (let i = totalPages - 2; i <= totalPages; i++)
              addBtn(i, i === page);
          } else {
            addEllipsis();
            addBtn(page - 1);
            addBtn(page, true);
            addBtn(page + 1);
            addEllipsis();
            addBtn(totalPages);
          }
        }

        // Right arrow
        const rightArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
        const rightArrow = document.createElement("button");
        rightArrow.innerHTML = rightArrowSvg;
        rightArrow.disabled = page === totalPages;
        rightArrow.className = "arrow-btn right-arrow";
        rightArrow.addEventListener("click", () => {
          if (page < totalPages) {
            currentPage = page + 1;
            // Fade out before changing page
            container.style.opacity = "0";
            setTimeout(() => {
              renderPage(currentPage);
            }, 400);
          }
          scrollToProgramsFilter();
        });
        pagination.appendChild(rightArrow);

        wrapper.appendChild(pagination);
      }

      renderPage(currentPage);
    }, 400);
  }

  // Create modal on load and keep it hidden
  let modal = createProgramModal();
  modal.classList.add("inactive");

  programsBlock.forEach((program, idx) => {
    const programType = program.children[0].innerText.trim();
    const programTypeConfig = {
      activity: {
        url: ACTIVITY_API_URL,
        dataKey: "activityList",
        errorMsg: "Failed to load activities.",
        assign: (programs) => {
          activityProgramData = sortProgramsAlphabetically(programs);
        },
        setupFilters: () => {
          filterState.selected = [];
        },
      },
      event: {
        url: EVENTS_API_URL,
        dataKey: "eventList",
        errorMsg: "Failed to load events.",
        assign: (programs) => {
          eventProgramData = programs;
        },
        setupFilters: (programs) => {
          filterState.categories = eventsCategoryMap[site].categories || [];
          filterState.allSubcategories =
            eventsCategoryMap[site].subcategories || [];
          filterState.selected = [];
        },
      },
      artist: {
        url: ARTISTS_API_URL,
        dataKey: "artistList",
        errorMsg: "Failed to load artists.",
        assign: (programs) => {
          artistProgramData = sortProgramsAlphabetically(programs);
        },
        setupFilters: () => {
          filterState.selected = [];
        },
      },
      festive: {
        url: FESTIVE_API_URL,
        dataKey: "festivitiesList",
        errorMsg: "Failed to load festive experiences.",
        assign: (programs) => {
          festiveProgramData = sortProgramsAlphabetically(programs);
        },
        setupFilters: () => {
          filterState.selected = [];
        },
      },
    };

    const config = programTypeConfig[programType];
    if (config) {
      fetch(config.url)
        .then((res) => res.json())
        .then((data) => {
          const programs = data.data?.[config.dataKey]?.items || [];
          config.assign(programs);
          if (typeof config.setupFilters === "function") {
            config.setupFilters(programs);
          }
          if (idx === 0) {
            activeProgramData = programs;
            renderPrograms(programs);
          }
        })
        .catch(() => {
          const container = document.querySelector(".programs-listings");
          if (container) container.innerHTML = `<p>${config.errorMsg}</p>`;
        });
    }
  });
}

function scrollToProgramsFilter() {
  const filterContainer = document.querySelector(".programs-filter-container");
  if (filterContainer) {
    const rect = filterContainer.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const offset = rect.top + scrollTop + 24;
    window.scrollTo({ top: offset, behavior: "smooth" });
  }
}
