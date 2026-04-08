import { moveInstrumentation } from "../../scripts/scripts.js";
import { createTopicsFilter } from "./topics-filter.js";
import {
  isUniversalEditor,
  createOptimizedPicture,
} from "../../scripts/aem.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isInRange(date, start, end) {
  if (!date || !start || !end) return false;
  const time = date.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();
  return time >= startTime && time <= endTime;
}

// Helper function to extract year from string
function extractYear(str) {
  const yearMatch = str.match(/\d{4}/);
  return yearMatch ? parseInt(yearMatch[0], 10) : -1;
}

function extractMonth(str) {
  const cleaned = str.trim();

  const cjkPattern = /(\d{1,2})\s*[月월]/;
  const cjkMatch = cleaned.match(cjkPattern);
  if (cjkMatch) {
    const monthNum = parseInt(cjkMatch[1], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return monthNum - 1;
    }
  }

  const withoutYear = cleaned
    .replace(/\d{4}/g, "")
    .replace(/[年월月]/g, "")
    .trim();

  const testYear = new Date().getFullYear();
  const attempts = [
    `${withoutYear} 1 ${testYear}`,
    `1 ${withoutYear} ${testYear}`,
    `${testYear}-${withoutYear}-1`,
    `${withoutYear}-1-${testYear}`,
  ];

  for (const attempt of attempts) {
    const parsed = new Date(attempt);
    if (!isNaN(parsed.getTime())) {
      return parsed.getMonth();
    }
  }

  const words = withoutYear.split(/[\s,.\-_]+/).filter((w) => w.length > 1);

  for (const word of words) {
    const locales = ["en", "de", "zh", "ja", "ko", "fr", "es", "it", "pt"];

    for (const locale of locales) {
      for (let m = 0; m < 12; m++) {
        const testDate = new Date(2000, m, 15);

        const longName = new Intl.DateTimeFormat(locale, {
          month: "long",
        }).format(testDate);
        const shortName = new Intl.DateTimeFormat(locale, {
          month: "short",
        }).format(testDate);

        const wordLower = word.toLowerCase();
        if (
          wordLower === longName.toLowerCase() ||
          wordLower === shortName.toLowerCase() ||
          longName.toLowerCase().startsWith(wordLower) ||
          shortName.toLowerCase().startsWith(wordLower)
        ) {
          return m;
        }
      }
    }
  }

  return -1;
}

function parseDateRangeString(rangeString) {
  if (!rangeString || typeof rangeString !== "string") return null;

  const trimmed = rangeString.trim();

  const hasDash = /[-–—]/.test(trimmed);

  if (hasDash) {
    const parts = trimmed.split(/\s*[-–—]\s*/).map((s) => s.trim());

    if (parts.length !== 2) return null;

    const startYear = extractYear(parts[0]);
    const startMonth = extractMonth(parts[0]);

    const endYear = extractYear(parts[1]);
    const endMonth = extractMonth(parts[1]);

    if (
      startYear === -1 ||
      startMonth === -1 ||
      endYear === -1 ||
      endMonth === -1
    ) {
      return null;
    }

    return {
      label: trimmed,
      start: new Date(startYear, startMonth, 1),
      end: new Date(endYear, endMonth + 1, 0),
    };
  } else {
    const year = extractYear(trimmed);
    const month = extractMonth(trimmed);

    if (year === -1 || month === -1) {
      return null;
    }

    return {
      label: trimmed,
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
    };
  }
}

function setupHoverEffects(item) {
  const imageContainer = item.querySelector(
    ".highlights-container-image-container"
  );
  const titleLink = item.querySelector(".highlights-container-title-link");

  if (imageContainer && titleLink) {
    // Set cursor pointer for images
    imageContainer.style.cursor = "pointer";

    // Desktop hover behavior
    imageContainer.addEventListener("mouseenter", () => {
      if (titleLink) titleLink.classList.add("hovered");
    });

    imageContainer.addEventListener("mouseleave", () => {
      if (titleLink) titleLink.classList.remove("hovered");
    });

    if (titleLink) {
      titleLink.addEventListener("mouseenter", () => {
        imageContainer.classList.add("hovered");
      });

      titleLink.addEventListener("mouseleave", () => {
        imageContainer.classList.remove("hovered");
      });
    }

    // Click navigation for images on desktop
    imageContainer.addEventListener("click", (e) => {
      e.preventDefault();
      if (titleLink && titleLink.href) {
        window.open(titleLink.href, "_blank");
      }
    });
  }
}

function toCapitalizedCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  const allTopicsText = placeholders?.pressTopics
    ? toCapitalizedCase(placeholders.pressTopics)
    : "All Topics";
  const allDatesText = placeholders?.pressDates
    ? toCapitalizedCase(placeholders.pressDates)
    : "All Dates";

  const container = document.createElement("div");
  container.className = "highlights-container";

  // Create a separate wrapper for the content that needs max-width
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "highlights-content-wrapper";

  const allRows = [...block.children];

  const sectionTitle = allRows[0]?.textContent.trim() || "";
  const viewAllText = allRows[2]?.textContent.trim() || "";
  const viewAllLink =
    allRows[3]?.querySelector("a")?.getAttribute("href") || "";

  // process topics
  const topicsString = allRows[4]?.textContent.trim() || "";
  const allTopics = topicsString
    ? [
        ...new Set(
          topicsString.split(",").map((topic) => topic.trim().toLowerCase())
        ),
      ]
    : [];

  // process date ranges
  const dateRangesString = allRows[5]?.textContent.trim() || "";
  const dateRanges = dateRangesString
    ? dateRangesString
        .split(",")
        .map((range) => parseDateRangeString(range.trim()))
        .filter((range) => range !== null)
        .sort((a, b) => b.start.getTime() - a.start.getTime())
    : [];

  const itemRows = allRows.slice(6);
  block.innerHTML = "";

  // header section
  const header = document.createElement("div");
  header.className = "highlights-container-header";
  if (sectionTitle) {
    const titleElement = document.createElement("h2");
    titleElement.className = "highlights-container-section-title";
    titleElement.textContent = sectionTitle;
    header.append(titleElement);
  }
  contentWrapper.append(header);

  // filters container
  const allFiltersContainer = document.createElement("div");
  allFiltersContainer.className = "highlights-container-all-filters-container";

  let selectedDateRange = null;
  const dateRangeFilter = createTopicsFilter({
    allTopics: dateRanges.map((range) => range.label),
    activeTopic: allDatesText,
    defaultLabel: allDatesText,
    onFilterChange: (selectedLabel) => {
      selectedDateRange =
        selectedLabel === allDatesText
          ? null
          : dateRanges.find((range) => range.label === selectedLabel);
      applyAllFilters();
    },
    allFiltersContainer,
  });

  let selectedTopics = [];
  const topicsFilter = createTopicsFilter({
    allTopics: allTopics,
    activeTopic: allTopicsText,
    defaultLabel: allTopicsText,
    onFilterChange: (selectedLabel) => {
      selectedTopics =
        selectedLabel === allTopicsText ? [] : [selectedLabel.toLowerCase()];
      applyAllFilters();
    },
    allFiltersContainer,
  });

  allFiltersContainer.append(topicsFilter);
  allFiltersContainer.append(dateRangeFilter);
  container.append(allFiltersContainer); // Full width

  // items container - goes in content wrapper
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "highlights-container-items";
  let originalItems = [];
  let filteredItems = [];
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 0;

  const isUniversalEditorActive = isUniversalEditor();

  // process each item row
  itemRows.forEach((row) => {
    const columns = [...row.children];
    if (columns.length < 8) return;

    const item = document.createElement("div");
    item.className = "highlights-container-item";
    moveInstrumentation(row, item);

    // process date
    let itemDate = null;
    const dateCol = columns[1];
    if (dateCol) {
      const dateStr = dateCol.textContent.trim();
      if (dateStr) {
        itemDate = new Date(dateStr);

        if (isNaN(itemDate.getTime())) {
          const year = extractYear(dateStr);
          const month = extractMonth(dateStr);

          if (year !== -1 && month !== -1) {
            itemDate = new Date(year, month, 15);
          }
        }

        if (itemDate && !isNaN(itemDate.getTime())) {
          item.dataset.date = itemDate.toISOString();
        }
      }
    }

    // process category (lowercase)
    const categoryString = columns[7]?.textContent.trim() || "";
    const categories = categoryString
      ? categoryString.split(",").map((cat) => cat.trim().toLowerCase())
      : [];

    item.dataset.category = categoryString.toLowerCase();
    item.dataset.categories = JSON.stringify(categories);

    const itemContent = document.createElement("div");
    itemContent.className = "highlights-container-item-content";

    // image handling
    const imageCol = columns[0];
    if (imageCol?.querySelector("picture")) {
      const imageContainer = document.createElement("div");
      imageContainer.className = "highlights-container-image-container";
      const picture = imageCol.querySelector("picture");
      const img = picture.querySelector("img");
      if (img?.src) {
        const breakpoints = [
          { media: "(min-width: 1600px)", width: "1600" },
          { media: "(min-width: 1200px)", width: "1200" },
          { width: "1000" },
        ];
        const optimizedPicture = createOptimizedPicture(
          img.src,
          img.alt,
          false,
          breakpoints
        );
        moveInstrumentation(picture, optimizedPicture);
        imageContainer.append(optimizedPicture);
      } else {
        const clonedPicture = picture.cloneNode(true);
        moveInstrumentation(picture, clonedPicture);
        imageContainer.append(clonedPicture);
      }
      itemContent.append(imageContainer);
    }

    // text content
    const textContent = document.createElement("div");
    textContent.className = "highlights-container-text-content";

    // date
    if (dateCol) {
      const dateElement = document.createElement("div");
      dateElement.className = "text-l2 highlights-container-date";
      dateElement.textContent = dateCol.textContent.trim();
      moveInstrumentation(dateCol, dateElement);
      textContent.append(dateElement);
    }

    // title with optional link
    const titleCol = columns[2];
    const titleLinkCol = columns[3];
    if (titleCol) {
      const titleWrapper = document.createElement("div");
      titleWrapper.className = "highlights-container-item-title text-h2";
      moveInstrumentation(titleCol, titleWrapper);
      const titleText = titleCol.textContent.trim();

      if (titleLinkCol?.querySelector("a")) {
        const link = titleLinkCol.querySelector("a").getAttribute("href");
        const linkElement = document.createElement("a");
        linkElement.href = link;
        linkElement.target = "_blank";
        linkElement.rel = "noopener noreferrer";
        linkElement.className = "highlights-container-title-link";
        linkElement.textContent = titleText;

        const underlineContainer = document.createElement("span");
        underlineContainer.className = "highlights-container-title-group";

        const textSpan = document.createElement("span");
        textSpan.className = "highlights-container-title-line";
        textSpan.textContent = titleText;

        const underline = document.createElement("span");
        underline.className = "highlights-container-title-underline";

        underlineContainer.append(textSpan, underline);
        linkElement.innerHTML = "";
        linkElement.appendChild(underlineContainer);

        titleWrapper.append(linkElement);
      } else {
        titleWrapper.textContent = titleText;
      }
      textContent.append(titleWrapper);
    }

    // description
    const descCol = columns[4];
    if (descCol) {
      const descElement = document.createElement("div");
      descElement.className = "text-p2 highlights-container-description";
      descElement.innerHTML = descCol.innerHTML;
      moveInstrumentation(descCol, descElement);
      textContent.append(descElement);
    }

    // button
    const buttonTextCol = columns[5];
    const buttonLinkCol = columns[6];
    if (buttonTextCol && buttonLinkCol?.querySelector("a")) {
      const buttonText = buttonTextCol.textContent.trim() || "View Press Info";
      const buttonLink = buttonLinkCol.querySelector("a").getAttribute("href");
      if (buttonLink) {
        const button = document.createElement("a");
        button.href = buttonLink;
        button.target = "_blank";
        button.rel = "noopener noreferrer";
        button.className =
          "highlights-container-mobile-button secondary-button";

        button.innerHTML = `
          <span class="underline-container">
            ${buttonText}
            <span class="underline"></span>
          </span>
        `;

        textContent.append(button);
      }
    }

    itemContent.append(textContent);
    item.append(itemContent);
    setupHoverEffects(item);
    originalItems.push({ element: item, date: itemDate, categories });
  });

  contentWrapper.append(itemsContainer);

  let paginationContainer;
  if (!isUniversalEditorActive) {
    paginationContainer = document.createElement("div");
    paginationContainer.className = "highlights-pagination-wrapper";
    contentWrapper.append(paginationContainer);
  }

  function renderPagination() {
    if (isUniversalEditorActive || !paginationContainer) return;

    const oldPagination = paginationContainer.querySelector(
      ".highlights-pagination"
    );
    if (oldPagination) oldPagination.remove();

    if (totalPages <= 1) {
      paginationContainer.style.display = "none";
      return;
    }

    paginationContainer.style.display = "flex";

    const pagination = document.createElement("div");
    pagination.className = "highlights-pagination";

    // Left arrow
    const leftArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left h-4 w-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>`;
    const leftArrow = document.createElement("button");
    leftArrow.innerHTML = leftArrowSvg;
    leftArrow.disabled = currentPage === 1;
    leftArrow.className = "highlights-arrow-btn highlights-left-arrow";
    leftArrow.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage = currentPage - 1;
        itemsContainer.style.opacity = "0";
        setTimeout(() => {
          renderCurrentPage();
          renderPagination();
          itemsContainer.style.opacity = "1";
          scrollToHighlightsFilters();
        }, 400);
      }
    });
    pagination.appendChild(leftArrow);

    function addBtn(i, isActive = false) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (isActive) btn.classList.add("highlights-active");
      btn.addEventListener("click", () => {
        currentPage = i;
        itemsContainer.style.opacity = "0";
        setTimeout(() => {
          renderCurrentPage();
          renderPagination();
          itemsContainer.style.opacity = "1";
          scrollToHighlightsFilters();
        }, 400);
      });
      pagination.appendChild(btn);
    }

    function addEllipsis() {
      const span = document.createElement("span");
      span.textContent = "...";
      pagination.appendChild(span);
    }

    // Pagination logic
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) addBtn(i, i === currentPage);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) addBtn(i, i === currentPage);
        addEllipsis();
        addBtn(totalPages);
      } else if (currentPage >= totalPages - 2) {
        addBtn(1);
        addEllipsis();
        for (let i = totalPages - 2; i <= totalPages; i++)
          addBtn(i, i === currentPage);
      } else {
        addBtn(1);
        addEllipsis();
        addBtn(currentPage, true);
        addEllipsis();
        addBtn(totalPages);
      }
    }

    // Right arrow
    const rightArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
    const rightArrow = document.createElement("button");
    rightArrow.innerHTML = rightArrowSvg;
    rightArrow.disabled = currentPage === totalPages;
    rightArrow.className = "highlights-arrow-btn highlights-right-arrow";
    rightArrow.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage = currentPage + 1;
        itemsContainer.style.opacity = "0";
        setTimeout(() => {
          renderCurrentPage();
          renderPagination();
          itemsContainer.style.opacity = "1";
          scrollToHighlightsFilters();
        }, 400);
      }
    });
    pagination.appendChild(rightArrow);

    paginationContainer.appendChild(pagination);
  }

  function applyAllFilters() {
    filteredItems = originalItems.filter((item) => {
      const dateMatch =
        !selectedDateRange ||
        (item.date &&
          isInRange(item.date, selectedDateRange.start, selectedDateRange.end));

      const categoryMatch =
        selectedTopics.length === 0 ||
        selectedTopics.some((selectedTopic) =>
          item.categories.some(
            (itemCategory) => itemCategory === selectedTopic.toLowerCase()
          )
        );

      return dateMatch && categoryMatch;
    });

    if (isUniversalEditorActive) {
      totalPages = 1;
      currentPage = 1;
    } else {
      totalPages = Math.ceil(filteredItems.length / itemsPerPage);
      if (totalPages === 0) totalPages = 1;
      currentPage = 1;
    }

    renderCurrentPage();
    renderPagination();
  }

  function renderCurrentPage() {
    itemsContainer.innerHTML = "";

    let itemsToDisplay;

    if (isUniversalEditorActive) {
      itemsToDisplay = filteredItems;
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      itemsToDisplay = filteredItems.slice(startIndex, endIndex);
    }

    itemsToDisplay.forEach((item) => {
      itemsContainer.append(item.element);
    });

    itemsContainer.style.transition = "opacity 0.4s ease-in-out";

    const noProgramsMessage = block.querySelector(".no-programs-message");
    if (noProgramsMessage) {
      if (filteredItems.length === 0) {
        noProgramsMessage.style.display = "flex";
        container.style.padding = "0";
      } else {
        noProgramsMessage.style.display = "none";
      }
    }
  }

  applyAllFilters();

  if (viewAllLink && viewAllText) {
    const viewAllContainer = document.createElement("div");
    viewAllContainer.className = "highlights-container-view-all";
    const viewAllLinkElement = document.createElement("a");
    viewAllLinkElement.href = viewAllLink;
    viewAllLinkElement.target = "_blank";
    viewAllLinkElement.rel = "noopener noreferrer";
    viewAllLinkElement.className = "highlights-container-view-all-link";

    viewAllLinkElement.innerHTML = `
      <span class="underline-container">
        ${viewAllText}
        <span class="underline"></span>
      </span>
    `;

    viewAllContainer.append(viewAllLinkElement);
    contentWrapper.append(viewAllContainer);
  }

  /* ------------------------------- Empty State ------------------------------ */
  const emptyState = document.createElement("div");
  emptyState.className = "highlights-container-empty-state";
  emptyState.innerHTML = `
    <div class="no-programs-message">
        <h2 class="text-h1">${
          placeholders?.eventsEmptyStateTitle ||
          "No hosted experiences today, wander at will"
        }</h2>
        <a class="cta-link split-text arrow-right" href=${
          placeholders?.eventsEmptyStateLink || "/newsletter"
        }><span class="animate-underline">${
    placeholders?.eventsEmptyStateLinkText || "Know when experiences arrive"
  }</span></a>
        </div>
  `;

  container.append(emptyState);
  container.append(contentWrapper);
  block.append(container);
}

// scroll function
function scrollToHighlightsFilters() {
  const filterContainer = document.querySelector(
    ".highlights-container-all-filters-container"
  );
  if (filterContainer) {
    const rect = filterContainer.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const offset = rect.top + scrollTop + 24;
    window.scrollTo({ top: offset, behavior: "smooth" });
  }
}
